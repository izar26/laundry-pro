<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Statistik Utama
        $stats = [
            'revenue_today' => Transaction::whereDate('created_at', today())
                ->where('payment_status', 'paid')
                ->sum('final_amount'),
            'revenue_month' => Transaction::whereMonth('created_at', today()->month)
                ->where('payment_status', 'paid')
                ->sum('final_amount'),
            'trx_active' => Transaction::whereIn('status', ['new', 'process', 'ready'])->count(),
            'customers_total' => Customer::count(),
            'customers_new_month' => Customer::whereMonth('created_at', today()->month)->count(),
        ];

        // 2. Grafik 7 Hari Terakhir
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
                    'name' => Carbon::parse($item->date)->format('D'), // Sen, Sel, Rab
                    'full_date' => $item->date,
                    'total' => (int) $item->total
                ];
            });

        // 3. Transaksi Terbaru (5)
        $recentTransactions = Transaction::with('customer')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($trx) {
                return [
                    'id' => $trx->id,
                    'invoice_code' => $trx->invoice_code,
                    'customer_name' => $trx->customer->name,
                    'service_summary' => $trx->details->first()->service_name . ($trx->details->count() > 1 ? ' +' . ($trx->details->count() - 1) . ' lainnya' : ''),
                    'final_amount' => $trx->final_amount,
                    'status' => $trx->status,
                    'payment_status' => $trx->payment_status,
                ];
            });

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'chartData' => $chartData,
            'recentTransactions' => $recentTransactions,
        ]);
    }
}