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

        // 1. Data Statistik (Selalu ada)
        $stats = [
            'revenue_today' => Transaction::whereDate('created_at', today())->where('payment_status', 'paid')->sum('final_amount'),
            'trx_today' => Transaction::whereDate('created_at', today())->count(),
            'unpaid_count' => Transaction::where('payment_status', 'unpaid')->count(),
            'process_count' => Transaction::whereIn('status', ['new', 'process'])->count(),
        ];

        // 2. Jika Mode Kanban (Board), ambil data active only tapi lengkap
        if ($request->get('view') === 'board') {
            $query = Transaction::with('customer.user') // Eager load minimal
                ->select('id', 'invoice_code', 'customer_id', 'user_id', 'total_amount', 'final_amount', 'payment_status', 'status', 'created_at')
                ->whereIn('status', ['pending', 'new', 'process', 'ready', 'done', 'cancelled']) // Ambil semua status
                ->whereDate('created_at', '>=', now()->subDays(30)) // Batasi 30 hari terakhir agar tidak berat
                ->orderBy('created_at', 'desc');

            // Filter Hak Akses untuk Kanban
            $user = $request->user();
            if ($user->hasRole('pelanggan')) {
                $query->whereHas('customer', function($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            }
            // Pegawai lihat semua (hapus filter user_id)

            $kanbanData = $query->get();
            
            return Inertia::render('Admin/Transactions/Index', [
                'transactions' => ['data' => []], // Dummy pagination object
                'kanbanData' => $kanbanData, // Kirim data khusus kanban
                'filters' => $request->only(['search', 'status', 'view']),
                'stats' => $stats,
            ]);
        }

        $query = Transaction::with(['customer.user', 'user']);

        // Filter Hak Akses
        $user = $request->user();
        
        // Pelanggan hanya bisa melihat transaksinya sendiri
        if ($user->hasRole('pelanggan')) {
            $query->whereHas('customer', function($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }
        // Pegawai, Admin, Owner bisa melihat SEMUA transaksi (tidak ada filter user_id lagi)

        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'unpaid') {
                $query->where('payment_status', 'unpaid');
            } else {
                $query->where('status', $request->status);
            }
        }

        if ($request->has('search')) {
            $query->where('invoice_code', 'like', "%{$request->search}%")
                  ->orWhereHas('customer.user', function($q) use ($request) {
                      $q->where('name', 'like', "%{$request->search}%");
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
                                       $q->whereNull('end_date')
                                         ->orWhere('end_date', '>=', now());
                                   })->get(),
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

            if ($request->filled('promo_code')) {
                $codePromo = Promotion::where('code', $request->promo_code)->first();
                if ($codePromo) $promosToCheck[] = $codePromo;
            }

            $autoPromos = Promotion::whereNull('code')
                ->where('is_active', true)
                ->where(function($q) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', now());
                })->get();
            
            foreach ($autoPromos as $p) $promosToCheck[] = $p;

            $totalWeightKg = $cartCollection->where('unit', 'kg')->sum('qty');

            foreach ($promosToCheck as $promo) {
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
                        $promoVal = $promo->value;
                    }
                    $discountAmount += $promoVal;
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
