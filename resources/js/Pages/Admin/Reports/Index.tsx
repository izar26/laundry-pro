import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { SpotlightCard } from "@/Components/ui/spotlight-card";
import { Button } from '@/Components/ui/button';
import { DataTable } from '@/Components/ui/data-table/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/Components/ui/badge';
import { TrendingUp, Users, ShoppingBag, Download, Calendar as CalendarIcon, FilterX, Activity } from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { format, subDays, startOfMonth, subMonths, startOfYear } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Calendar } from "@/Components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import { cn } from "@/lib/utils";
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportsIndex({ summary, dailyRevenue, topServices, transactions, heatmapData, filters }: any) {
    const [startDate, setStartDate] = useState<Date | undefined>(filters.start_date ? new Date(filters.start_date) : undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(filters.end_date ? new Date(filters.end_date) : undefined);

    const handleFilter = () => {
        router.get(route('reports.index'), { 
            start_date: startDate ? format(startDate, 'yyyy-MM-dd') : '', 
            end_date: endDate ? format(endDate, 'yyyy-MM-dd') : '' 
        }, { preserveState: true });
    };

    const handleReset = () => {
        setStartDate(undefined);
        setEndDate(undefined);
        router.get(route('reports.index'));
    };

    // Quick Date Presets
    const setPreset = (type: 'today' | '7days' | '30days' | 'month') => {
        const end = new Date();
        let start = new Date();

        if (type === 'today') start = new Date();
        if (type === '7days') start = subDays(new Date(), 7);
        if (type === '30days') start = subDays(new Date(), 30);
        if (type === 'month') start = startOfMonth(new Date());

        setStartDate(start);
        setEndDate(end);
        
        // Auto apply
        router.get(route('reports.index'), { 
            start_date: format(start, 'yyyy-MM-dd'), 
            end_date: format(end, 'yyyy-MM-dd') 
        }, { preserveState: true });
    };

    const handleExport = () => {
        const url = route('reports.export', { 
            start_date: startDate ? format(startDate, 'yyyy-MM-dd') : '', 
            end_date: endDate ? format(endDate, 'yyyy-MM-dd') : '' 
        });
        window.location.href = url;
    };

    const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "invoice_code",
            header: "Invoice",
            cell: ({ row }) => <div className="font-mono text-xs font-bold">{row.getValue("invoice_code")}</div>
        },
        {
            accessorKey: "created_at",
            header: "Tanggal",
            cell: ({ row }) => <div className="text-xs text-muted-foreground">{format(new Date(row.getValue("created_at")), "dd MMM yyyy HH:mm", { locale: idLocale })}</div>
        },
        {
            accessorKey: "customer.user.name",
            header: "Pelanggan",
            cell: ({ row }) => <div className="font-medium">{row.original.customer.user?.name || 'Umum'}</div>
        },
        {
            accessorKey: "final_amount",
            header: "Total",
            cell: ({ row }) => <div className="font-bold text-sm text-emerald-600">{formatRupiah(row.getValue("final_amount"))}</div>
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <Badge variant="outline" className="capitalize text-[10px]">{row.getValue("status")}</Badge>
        }
    ];

    return (
        <>
            <Head title="Laporan Keuangan" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Laporan Keuangan</h2>
                    <p className="text-muted-foreground">Analisis performa bisnis laundry Anda.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 bg-card p-1.5 rounded-xl border shadow-sm w-full lg:w-auto">
                    {/* Quick Presets */}
                    <div className="flex gap-1 mr-2 border-r pr-2">
                        <button onClick={() => setPreset('today')} className="px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors">Hari Ini</button>
                        <button onClick={() => setPreset('7days')} className="px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors">7 Hari</button>
                        <button onClick={() => setPreset('month')} className="px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors">Bulan Ini</button>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-[130px] justify-start text-left font-normal h-8 text-xs", !startDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {startDate ? format(startDate, "dd MMM yyyy") : <span>Mulai</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
                    </Popover>
                    <span className="text-muted-foreground">-</span>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-[130px] justify-start text-left font-normal h-8 text-xs", !endDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {endDate ? format(endDate, "dd MMM yyyy") : <span>Selesai</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => startDate ? date < startDate : false} /></PopoverContent>
                    </Popover>

                    <Button size="sm" onClick={handleFilter} className="h-8">Terapkan</Button>
                    <Button size="sm" variant="ghost" onClick={handleReset} title="Reset Filter" className="h-8 px-2"><FilterX className="h-4 w-4 text-muted-foreground"/></Button>
                    
                    <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>
                    
                    <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-2 ml-auto sm:ml-0">
                        <Download className="h-3 w-3" /> <span className="hidden sm:inline">Export Excel</span>
                    </Button>
                </div>
            </div>

            {/* Ringkasan Spotlight */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.2)" className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatRupiah(summary.revenue)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Periode terpilih</p>
                    </CardContent>
                </SpotlightCard>
                <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.2)" className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <ShoppingBag className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.transactions_count}</div>
                        <p className="text-xs text-muted-foreground mt-1">Transaksi sukses</p>
                    </CardContent>
                </SpotlightCard>
                <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.2)" className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pelanggan Baru</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-orange-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.customers_new}</div>
                        <p className="text-xs text-muted-foreground mt-1">Terdaftar</p>
                    </CardContent>
                </SpotlightCard>
            </div>

            {/* Heatmap Activity */}
            <Card className="mb-6 border-none shadow-md overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Aktivitas Transaksi (Setahun Terakhir)
                    </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto pb-6">
                    <div className="min-w-[600px]">
                        <CalendarHeatmap
                            startDate={subDays(new Date(), 365)}
                            endDate={new Date()}
                            values={heatmapData}
                            classForValue={(value: any) => {
                                if (!value) {
                                    return 'color-empty';
                                }
                                return `color-scale-${Math.min(value.count, 4)}`;
                            }}
                            tooltipDataAttrs={(value: any) => {
                                if (!value || !value.date) {
                                    return { 'data-tip': 'Tidak ada data' };
                                }
                                return {
                                    'data-tip': `${format(new Date(value.date), 'dd MMM yyyy')}: ${value.count} Transaksi`,
                                };
                            }}
                            showWeekdayLabels
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Grafik */}
            <div className="flex flex-col gap-6 mb-6">
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Tren Pendapatan (Area Chart)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px]">
                            {dailyRevenue.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis 
                                            dataKey="date" 
                                            tickFormatter={(val) => format(new Date(val), 'dd/MM')}
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis 
                                            tickFormatter={(val) => `${val/1000}k`}
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip 
                                            formatter={((value: number) => [formatRupiah(value), 'Pendapatan']) as any}
                                            labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy', { locale: idLocale })}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <TrendingUp className="h-10 w-10 mb-2" />
                                    <p>Belum ada data pendapatan</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Top 5 Layanan Terlaris</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {topServices.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={topServices}
                                        margin={{ top: 0, right: 30, left: 40, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="service_name" 
                                            type="category" 
                                            width={200}
                                            tick={{ fontSize: 11 }}
                                            interval={0}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={((value: number) => [value + 'x', 'Terjual']) as any}
                                        />
                                        <Bar dataKey="total_qty" radius={[0, 4, 4, 0]} barSize={32}>
                                            {topServices.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <ShoppingBag className="h-10 w-10 mb-2" />
                                    <p>Belum ada data layanan</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabel Detail */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle>Rincian Transaksi</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={transactions.data} pagination={transactions} />
                </CardContent>
            </Card>
        </>
    );
}

ReportsIndex.layout = (page: any) => <AdminLayout children={page} />;