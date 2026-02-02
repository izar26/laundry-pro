<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\Setting;
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
        
        // Filter Service (Drill-down)
        $serviceFilter = $request->input('service_name');

        // Hitung durasi hari untuk perbandingan tren
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        $diffInDays = $start->diffInDays($end) + 1;
        
        $prevStartDate = $start->copy()->subDays($diffInDays)->toDateString();
        $prevEndDate = $start->copy()->subDays(1)->toDateString();

        // Helper Query Ringkasan
        $getSummary = function ($sDate, $eDate) {
            return [
                'revenue' => Transaction::whereBetween('created_at', [$sDate . ' 00:00:00', $eDate . ' 23:59:59'])
                            ->where('payment_status', 'paid')
                            ->sum('final_amount'),
                'transactions_count' => Transaction::whereBetween('created_at', [$sDate . ' 00:00:00', $eDate . ' 23:59:59'])
                            ->where('payment_status', 'paid')
                            ->count(),
                'customers_new' => \App\Models\User::role('pelanggan')->whereBetween('created_at', [$sDate . ' 00:00:00', $eDate . ' 23:59:59'])
                            ->count(),
            ];
        };

        $currentData = $getSummary($startDate, $endDate);
        $prevData = $getSummary($prevStartDate, $prevEndDate);

        // Hitung Persentase Tren
        $calculateGrowth = function ($current, $prev) {
            if ($prev == 0) return $current > 0 ? 100 : 0;
            return round((($current - $prev) / $prev) * 100, 1);
        };

        $summary = [
            'revenue' => $currentData['revenue'],
            'revenue_growth' => $calculateGrowth($currentData['revenue'], $prevData['revenue']),
            'transactions_count' => $currentData['transactions_count'],
            'transactions_growth' => $calculateGrowth($currentData['transactions_count'], $prevData['transactions_count']),
            'customers_new' => $currentData['customers_new'],
            'customers_growth' => $calculateGrowth($currentData['customers_new'], $prevData['customers_new']),
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

        // 4. Tabel Transaksi (Support Drill Down)
        $transactionsQuery = Transaction::with(['customer.user', 'details'])
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);

        if ($serviceFilter) {
            $transactionsQuery->whereHas('details', function($q) use ($serviceFilter) {
                $q->where('service_name', $serviceFilter);
            });
        }

        $transactions = $transactionsQuery->latest()
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

        // 6. Target Progress (Bulanan)
        // Ambil dari Setting jika ada, default 50 Juta
        // $targetRevenue = Setting::where('key', 'target_revenue_monthly')->value('value') ?? 50000000;
        $targetRevenue = 50000000; // Hardcode dulu biar cepat
        
        // Hitung pendapatan bulan ini (current month) terlepas dari filter tanggal
        $currentMonthRevenue = Transaction::whereMonth('created_at', Carbon::now()->month)
                                ->whereYear('created_at', Carbon::now()->year)
                                ->where('payment_status', 'paid')
                                ->sum('final_amount');
        
        $targetProgress = min(round(($currentMonthRevenue / $targetRevenue) * 100), 100);

        return Inertia::render('Admin/Reports/Index', [
            'summary' => $summary,
            'dailyRevenue' => $dailyRevenue,
            'topServices' => $topServices,
            'transactions' => $transactions,
            'heatmapData' => $heatmapData,
            'targetData' => [
                'target' => $targetRevenue,
                'current' => $currentMonthRevenue,
                'progress' => $targetProgress
            ],
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'service_name' => $serviceFilter,
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
