<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\User;
use App\Models\Service;
use App\Models\Promotion;
use App\Models\Setting; // Import Setting yang benar
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Midtrans\Config;
use Midtrans\Snap;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    public function __construct()
    {
        // Set Config Midtrans Global
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = filter_var(config('services.midtrans.is_production'), FILTER_VALIDATE_BOOLEAN);
        Config::$isSanitized = true;
        Config::$is3ds = true;
    }

    public function index(Request $request)
    {
        // 0. Auto-Check Status jika kembali dari Midtrans (Ada order_id di URL)
        if ($request->has('order_id')) {
            $invoice = $request->order_id;
            $trx = Transaction::where('invoice_code', $invoice)->first();
            
            // Cek ke Midtrans hanya jika transaksi ada dan belum lunas
            if ($trx && $trx->payment_status === 'unpaid') {
                try {
                    $status = \Midtrans\Transaction::status($invoice);
                    if ($status->transaction_status == 'settlement' || $status->transaction_status == 'capture') {
                        $trx->update(['payment_status' => 'paid']);
                        return redirect()->route('transactions.index')->with('message', 'Pembayaran berhasil diverifikasi otomatis.');
                    }
                } catch (\Exception $e) {
                    // Ignore error
                }
            }
        }

        $user = $request->user();

        // Helper: Terapkan filter hak akses berdasarkan role
        $applyRoleScope = function ($query) use ($user) {
            if ($user->hasRole('pelanggan')) {
                // Pelanggan hanya melihat transaksi miliknya sendiri
                $query->whereHas('customer', function($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            } elseif ($user->hasRole('pegawai')) {
                // Pegawai hanya melihat transaksi yang dibuat oleh dirinya
                $query->where('user_id', $user->id);
            }
            // Admin & Owner bisa melihat semua transaksi
        };

        // 1. Data Statistik (Di-scope per role)
        $statsBaseQuery = fn() => Transaction::query()->tap($applyRoleScope);
        $stats = [
            'revenue_today' => $statsBaseQuery()->whereDate('created_at', today())->where('payment_status', 'paid')->sum('final_amount'),
            'trx_today' => $statsBaseQuery()->whereDate('created_at', today())->count(),
            'unpaid_count' => $statsBaseQuery()->where('payment_status', 'unpaid')->count(),
            'process_count' => $statsBaseQuery()->whereIn('status', ['new', 'process'])->count(),
        ];

        // 2. Jika Mode Kanban (Board), ambil data active only tapi lengkap
        if ($request->get('view') === 'board') {
            $query = Transaction::with('customer.user')
                ->select('id', 'invoice_code', 'customer_id', 'user_id', 'total_amount', 'final_amount', 'payment_status', 'status', 'created_at')
                ->whereIn('status', ['pending', 'new', 'process', 'ready', 'done', 'cancelled'])
                ->whereDate('created_at', '>=', now()->subDays(30))
                ->orderBy('created_at', 'desc');

            // Terapkan filter hak akses
            $applyRoleScope($query);

            $kanbanData = $query->get();
            
            return Inertia::render('Admin/Transactions/Index', [
                'transactions' => ['data' => []], // Dummy pagination object
                'kanbanData' => $kanbanData,
                'filters' => $request->only(['search', 'status', 'view']),
                'stats' => $stats,
            ]);
        }

        $query = Transaction::with(['customer.user', 'user']);

        // Terapkan filter hak akses
        $applyRoleScope($query);

        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'unpaid') {
                $query->where('payment_status', 'unpaid');
            } else {
                $query->where('status', $request->status);
            }
        }

        // Search — dibungkus dalam closure agar tidak mem-bypass filter role
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_code', 'like', "%{$search}%")
                  ->orWhereHas('customer.user', function($sub) use ($search) {
                      $sub->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $transactions = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/Transactions/Index', [
            'transactions' => $transactions,
            'kanbanData' => [],
            'filters' => $request->only(['search', 'status']),
            'stats' => $stats,
        ]);
    }

    public function create()
    {
        // Ambil data Customer lengkap dengan relasi user (untuk nama)
        $customers = \App\Models\Customer::with('user')->get()->map(function($customer) {
            return [
                'id' => $customer->id, // ID Customer (bukan ID User)
                'name' => $customer->user->name,
                'phone' => $customer->phone ?? '-',
                'user_id' => $customer->user_id // Tambahan untuk referensi
            ];
        });

        return Inertia::render('Admin/Transactions/Create', [
            'customers' => $customers,
            'services' => Service::all(),
            'promotions' => Promotion::where('is_active', true)
                                   ->where(function($q) {
                                       $q->whereNull('start_date')
                                         ->orWhere('start_date', '<=', now()->toDateString());
                                   })
                                   ->where(function($q) {
                                       $q->whereNull('end_date')
                                         ->orWhere('end_date', '>=', now()->toDateString());
                                   })->get(), // Sudah termasuk semua kolom: name, code, service_id, start_date, end_date, dll
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $isCustomer = $user->hasRole('pelanggan');

        // Jika user adalah pelanggan, customer_id otomatis dirinya sendiri
        if ($isCustomer) {
            $request->merge(['customer_id' => $user->customer->id ?? null]);
        }

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.service_id' => 'required|exists:services,id',
            'items.*.qty' => 'required|numeric|min:0.1',
            'promo_code' => 'nullable|exists:promotions,code',
            'payment_method' => 'required|in:cash,midtrans',
        ]);

        DB::beginTransaction();
        try {
            $totalAmount = 0;
            // ... (rest of logic) ...
            
            // ... inside transaction creation ...
            // $initialStatus = $isCustomer ? 'pending' : 'new';

            $items = [];
            $cartCollection = collect();

            foreach ($validated['items'] as $item) {
                $service = Service::find($item['service_id']);
                $subtotal = $service->price * $item['qty'];
                $totalAmount += $subtotal;

                $detailItem = [
                    'service_id' => $service->id,
                    'service_name' => $service->name,
                    'unit' => $service->unit,
                    'qty' => $item['qty'],
                    'price' => $service->price,
                    'subtotal' => $subtotal,
                ];
                
                $items[] = $detailItem;
                $cartCollection->push($detailItem);
            }

            // Diskon logic
            $discountAmount = 0;
            $promosToCheck = [];
            $processedPromoIds = []; // Anti double-apply
            $discountDetailsArray = []; // Menyimpan detail potongan tiap promo

            if ($request->filled('promo_code')) {
                $codePromo = Promotion::where('code', $request->promo_code)
                    ->where('is_active', true)
                    ->where(function($q) {
                        $q->whereNull('start_date')->orWhere('start_date', '<=', now()->toDateString());
                    })
                    ->where(function($q) {
                        $q->whereNull('end_date')->orWhere('end_date', '>=', now()->toDateString());
                    })
                    ->first();
                
                if ($codePromo) {
                    // Validasi service_id: jika promo khusus layanan tertentu, pastikan ada di cart
                    if ($codePromo->service_id) {
                        $hasTargetService = $cartCollection->where('service_id', $codePromo->service_id)->isNotEmpty();
                        if (!$hasTargetService) {
                            $serviceName = Service::find($codePromo->service_id)->name ?? 'tertentu';
                            throw new \Exception("Promo ini khusus untuk layanan \"{$serviceName}\" yang belum ada di keranjang.");
                        }
                    }
                    $promosToCheck[] = $codePromo;
                } else {
                    throw new \Exception("Kode promo tidak valid, sudah kedaluwarsa, atau tidak aktif.");
                }
            }

            $autoPromos = Promotion::whereNull('code')
                ->where('is_active', true)
                ->where(function($q) {
                    $q->whereNull('start_date')->orWhere('start_date', '<=', now()->toDateString());
                })
                ->where(function($q) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', now()->toDateString());
                })->get();
            
            foreach ($autoPromos as $p) $promosToCheck[] = $p;

            $totalWeightKg = $cartCollection->where('unit', 'kg')->sum('qty');

            foreach ($promosToCheck as $promo) {
                // Anti double-apply: skip jika promo ini sudah diproses
                if (in_array($promo->id, $processedPromoIds)) continue;

                $eligible = true;
                if ($promo->min_amount && $totalAmount < $promo->min_amount) $eligible = false;
                if ($promo->min_weight && $totalWeightKg < $promo->min_weight) $eligible = false;

                if ($eligible) {
                    $baseCalculation = $totalAmount;
                    if ($promo->service_id) {
                        $targetItems = $cartCollection->where('service_id', $promo->service_id);
                        if ($targetItems->isEmpty()) continue;
                        $baseCalculation = $targetItems->sum('subtotal');
                    }

                    $promoVal = 0;
                    if ($promo->type === 'percentage') {
                        $promoVal = $baseCalculation * ($promo->value / 100);
                    } else {
                        $promoVal = min($promo->value, $baseCalculation); // Cap fixed discount ke base value
                    }
                    if ($promoVal > 0) {
                        $discountAmount += $promoVal;
                        $processedPromoIds[] = $promo->id; // Tandai sudah diproses
                        
                        $discountDetailsArray[] = [
                            'promo_id' => $promo->id,
                            'name' => $promo->name,
                            'code' => $promo->code,
                            'amount' => $promoVal
                        ];
                    }
                }
            }

            if ($discountAmount > $totalAmount) $discountAmount = $totalAmount;
            $finalAmount = $totalAmount - $discountAmount;

            $initialPaymentStatus = $validated['payment_method'] === 'cash' ? 'paid' : 'unpaid';
            
            // Jika pelanggan yang input, status awal 'pending' (menunggu konfirmasi admin/pegawai)
            // Jika pegawai/admin, status awal 'new' (langsung masuk antrian)
            $initialStatus = $isCustomer ? 'pending' : 'new';

            $transaction = Transaction::create([
                'invoice_code' => 'TRX-' . date('Ymd') . '-' . strtoupper(Str::random(4)),
                'customer_id' => $validated['customer_id'],
                'user_id' => auth()->id(),
                'total_amount' => $totalAmount,
                'discount_amount' => $discountAmount,
                'discount_details' => count($discountDetailsArray) > 0 ? $discountDetailsArray : null,
                'final_amount' => $finalAmount,
                'payment_method' => $validated['payment_method'],
                'payment_status' => $initialPaymentStatus,
                'status' => $initialStatus,
            ]);

            foreach ($items as $detail) {
                TransactionDetail::create([
                    'transaction_id' => $transaction->id,
                    'service_id' => $detail['service_id'],
                    'service_name' => $detail['service_name'],
                    'qty' => $detail['qty'],
                    'price' => $detail['price'],
                    'subtotal' => $detail['subtotal'],
                ]);
            }

            $snapToken = null;
            if ($validated['payment_method'] === 'midtrans' && $finalAmount > 0) {
                $sKey = config('services.midtrans.server_key');
                Config::$serverKey = $sKey;
                Config::$isProduction = filter_var(config('services.midtrans.is_production'), FILTER_VALIDATE_BOOLEAN);
                Config::$isSanitized = true;
                Config::$is3ds = true;

                $customer = Customer::with('user')->find($validated['customer_id']);

                $params = [
                    'transaction_details' => [
                        'order_id' => $transaction->invoice_code,
                        'gross_amount' => (int) $finalAmount,
                    ],
                    'customer_details' => [
                        'first_name' => $customer->user->name,
                        'email' => $customer->user->email,
                        'phone' => $customer->phone,
                    ],
                    'callbacks' => [
                        'finish' => route('transactions.index'),
                    ]
                ];

                try {
                    $snapToken = Snap::getSnapToken($params);
                    $transaction->update(['snap_token' => $snapToken]);
                } catch (\Exception $e) {
                    Log::error('Midtrans Error Detail: ' . $e->getMessage());
                    throw $e;
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Transaksi berhasil dibuat',
                'transaction' => $transaction,
                'snap_token' => $snapToken
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal: ' . $e->getMessage()], 500);
        }
    }

    public function show(Transaction $transaction)
    {
        $transaction->load(['customer', 'user', 'details']);
        return Inertia::render('Admin/Transactions/Show', [
            'transaction' => $transaction
        ]);
    }

    public function checkStatus(Transaction $transaction)
    {
        try {
            $status = \Midtrans\Transaction::status($transaction->invoice_code);
            $transactionStatus = $status->transaction_status;
            $fraud = $status->fraud_status;

            $newStatus = $transaction->payment_status;

            if ($transactionStatus == 'capture') {
                if ($fraud == 'challenge') {
                    $newStatus = 'unpaid';
                } else if ($fraud == 'accept') {
                    $newStatus = 'paid';
                }
            } else if ($transactionStatus == 'settlement') {
                $newStatus = 'paid';
            } else if ($transactionStatus == 'cancel' || $transactionStatus == 'deny' || $transactionStatus == 'expire') {
                $newStatus = 'cancelled';
            } else if ($transactionStatus == 'pending') {
                $newStatus = 'unpaid';
            }

            if ($newStatus !== $transaction->payment_status) {
                $transaction->update(['payment_status' => $newStatus]);
                return redirect()->back()->with('message', 'Status pembayaran berhasil diperbarui: ' . $newStatus);
            }

            return redirect()->back()->with('message', 'Status pembayaran belum berubah (' . $transactionStatus . ').');

        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['message' => 'Gagal mengecek status ke Midtrans: ' . $e->getMessage()]);
        }
    }

    public function markAsPaid(Transaction $transaction)
    {
        $transaction->update(['payment_status' => 'paid']);
        return redirect()->back()->with('message', 'Pembayaran berhasil dikonfirmasi.');
    }

    public function updateStatus(Request $request, Transaction $transaction)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,new,process,ready,done,cancelled',
        ]);
        $transaction->update(['status' => $validated['status']]);
        return redirect()->back()->with('message', 'Status laundry diperbarui.');
    }

    public function cancel(Transaction $transaction)
    {
        if ($transaction->status !== 'pending') {
            return redirect()->back()->withErrors(['message' => 'Hanya transaksi status menunggu yang bisa dibatalkan.']);
        }
        
        // Pastikan pelanggan hanya bisa membatalkan miliknya sendiri (extra security, walau policy handle)
        $user = auth()->user();
        if ($user->hasRole('pelanggan') && $transaction->customer->user_id !== $user->id) {
            abort(403);
        }

        $transaction->update(['status' => 'cancelled']);
        return redirect()->back()->with('message', 'Transaksi berhasil dibatalkan.');
    }

    public function print(Transaction $transaction)
    {
        $transaction->load(['customer.user', 'user', 'details']);
        $settings = Setting::all()->pluck('value', 'key');
        return view('print.receipt', compact('transaction', 'settings'));
    }

    public function destroy(Transaction $transaction)
    {
        $transaction->delete();
        return redirect()->back()->with('message', 'Transaksi berhasil dihapus.');
    }
}
