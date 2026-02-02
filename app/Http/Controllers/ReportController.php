<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionDetail;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\TransactionsExport;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        // 1. Ringkasan
        $summary = [
            'revenue' => Transaction::whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                        ->where('payment_status', 'paid')
                        ->sum('final_amount'),
            'transactions_count' => Transaction::whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                        ->where('payment_status', 'paid')
                        ->count(),
            'customers_new' => \App\Models\User::role('pelanggan')->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                        ->count(),
        ];

        // 2. Grafik Pendapatan Harian
        $dailyRevenue = Transaction::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(final_amount) as total')
            )
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('payment_status', 'paid')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // 3. Layanan Terlaris (Pie Chart)
        $topServices = TransactionDetail::select('service_name', DB::raw('SUM(qty) as total_qty'))
            ->whereHas('transaction', function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            })
            ->groupBy('service_name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        // 4. Tabel Transaksi
        $transactions = Transaction::with(['customer.user'])
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        // 5. Data Heatmap (Setahun Terakhir)
        $heatmapData = Transaction::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count')
            )
            ->where('created_at', '>=', Carbon::now()->subYear())
            ->groupBy('date')
            ->get()
            ->map(function ($item) {
                return ['date' => $item->date, 'count' => $item->count];
            });

        return Inertia::render('Admin/Reports/Index', [
            'summary' => $summary,
            'dailyRevenue' => $dailyRevenue,
            'topServices' => $topServices,
            'transactions' => $transactions,
            'heatmapData' => $heatmapData, // Kirim data heatmap
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]
        ]);
    }

    public function export(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        return Excel::download(new TransactionsExport($startDate, $endDate), "laporan-laundry-$startDate-$endDate.xlsx");
    }
}
