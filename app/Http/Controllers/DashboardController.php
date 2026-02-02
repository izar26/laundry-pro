<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isPelanggan = $user->hasRole('pelanggan');

        if ($isPelanggan) {
            // --- DATA KHUSUS PELANGGAN ---
            
            // 1. Statistik Pribadi
            $stats = [
                'revenue_today' => Transaction::whereHas('customer', function($q) use ($user) { $q->where('user_id', $user->id); })
                    ->whereDate('created_at', today())
                    ->where('payment_status', 'paid')
                    ->sum('final_amount'), // Total Belanja Hari Ini
                'revenue_month' => Transaction::whereHas('customer', function($q) use ($user) { $q->where('user_id', $user->id); })
                    ->whereMonth('created_at', today()->month)
                    ->where('payment_status', 'paid')
                    ->sum('final_amount'), // Total Belanja Bulan Ini
                'trx_active' => Transaction::whereHas('customer', function($q) use ($user) { $q->where('user_id', $user->id); })
                    ->whereIn('status', ['new', 'process', 'ready', 'pending'])
                    ->count(), // Cucian Saya yang Aktif
                'customers_total' => $user->customer->points ?? 0, // Ganti jadi Poin Saya
                'is_pelanggan' => true // Flag untuk frontend
            ];

            // 2. Grafik Pengeluaran Pribadi
            $chartData = Transaction::select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(final_amount) as total')
                )
                ->whereHas('customer', function($q) use ($user) { $q->where('user_id', $user->id); })
                ->where('created_at', '>=', Carbon::now()->subDays(6))
                ->where('payment_status', 'paid')
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(function ($item) {
                    return [
                        'name' => Carbon::parse($item->date)->format('D'),
                        'full_date' => $item->date,
                        'total' => (int) $item->total
                    ];
                });

            // 3. Transaksi Saya Terbaru
            $recentTransactions = Transaction::with(['customer.user', 'details'])
                ->whereHas('customer', function($q) use ($user) { $q->where('user_id', $user->id); })
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($trx) {
                    return [
                        'id' => $trx->id,
                        'invoice_code' => $trx->invoice_code,
                        'customer_name' => 'Anda', // Tampilkan diri sendiri
                        'service_summary' => $trx->details->first() ? ($trx->details->first()->service_name . ($trx->details->count() > 1 ? ' +' . ($trx->details->count() - 1) . ' lainnya' : '')) : '-',
                        'final_amount' => $trx->final_amount,
                        'status' => $trx->status,
                        'payment_status' => $trx->payment_status,
                    ];
                });

        } else {
            // --- DATA GLOBAL (ADMIN, OWNER, PEGAWAI) ---

            // 1. Statistik Global
            $stats = [
                'revenue_today' => Transaction::whereDate('created_at', today())
                    ->where('payment_status', 'paid')
                    ->sum('final_amount'),
                'revenue_month' => Transaction::whereMonth('created_at', today()->month)
                    ->where('payment_status', 'paid')
                    ->sum('final_amount'),
                'trx_active' => Transaction::whereIn('status', ['new', 'process', 'ready', 'pending'])->count(),
                'customers_total' => User::role('pelanggan')->count(),
                'customers_new_month' => User::role('pelanggan')->whereMonth('created_at', today()->month)->count(),
                'is_pelanggan' => false
            ];

            // 2. Grafik Global
            $chartData = Transaction::select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(final_amount) as total')
                )
                ->where('created_at', '>=', Carbon::now()->subDays(6))
                ->where('payment_status', 'paid')
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(function ($item) {
                    return [
                        'name' => Carbon::parse($item->date)->format('D'),
                        'full_date' => $item->date,
                        'total' => (int) $item->total
                    ];
                });

            // 3. Transaksi Terbaru Global
            $recentTransactions = Transaction::with(['customer.user', 'details'])
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($trx) {
                    return [
                        'id' => $trx->id,
                        'invoice_code' => $trx->invoice_code,
                        'customer_name' => $trx->customer->user->name ?? 'Umum',
                        'service_summary' => $trx->details->first() ? ($trx->details->first()->service_name . ($trx->details->count() > 1 ? ' +' . ($trx->details->count() - 1) . ' lainnya' : '')) : '-',
                        'final_amount' => $trx->final_amount,
                        'status' => $trx->status,
                        'payment_status' => $trx->payment_status,
                    ];
                });
        }

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'chartData' => $chartData,
            'recentTransactions' => $recentTransactions,
        ]);
    }
}