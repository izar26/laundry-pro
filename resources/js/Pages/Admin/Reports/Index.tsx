import { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { DataTable } from '@/Components/ui/data-table/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/Components/ui/badge';
import { Skeleton } from '@/Components/ui/skeleton';
import { TrendingUp, TrendingDown, Users, ShoppingBag, Download, Calendar as CalendarIcon, FilterX, Activity, Target } from 'lucide-react';
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
import { format, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { SimpleCalendar as Calendar } from "@/Components/ui/simple-calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import { cn } from "@/lib/utils";
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { motion } from 'framer-motion';
import { DateRange } from "react-day-picker";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Add internal style for Heatmap & Chart tweaks
const styles = `
  .react-calendar-heatmap text {
    font-size: 8px;
    fill: hsl(var(--muted-foreground));
  }
  .react-calendar-heatmap-weekday-label {
    transform: translateX(-5px);
  }
  /* Remove Recharts focus outline */
  .recharts-rectangle:focus,
  .recharts-sector:focus,
  .recharts-layer:focus,
  .recharts-surface:focus {
    outline: none !important;
  }
`;

// Component: Trend Indicator
const TrendBadge = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    return (
        <div className={cn(
            "flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
            isPositive ? "text-emerald-600 bg-emerald-500/10" : "text-rose-600 bg-rose-500/10"
        )}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(value)}%
        </div>
    );
};

// Component: Target Progress
const TargetProgress = ({ current, target, progress }: { current: number, target: number, progress: number }) => {
    return (
        <div className="mt-6 mb-2">
            <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2 font-medium text-muted-foreground">
                    <Target className="h-4 w-4 text-primary" />
                    Target Bulan Ini
                </div>
                <div className="font-bold">
                    {progress}% <span className="text-muted-foreground font-normal">({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(current)} / {new Intl.NumberFormat('id-ID', { notation: "compact", compactDisplay: "short" }).format(target)})</span>
                </div>
            </div>
            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={cn(
                        "h-full rounded-full",
                        progress >= 100 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-primary to-blue-400"
                    )}
                />
            </div>
        </div>
    );
};

// Custom Animated Counter Component
const AnimatedCounter = ({ value, duration = 1.5 }: { value: number, duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / (duration * 1000), 1);
            const ease = 1 - Math.pow(1 - percentage, 4);
            setCount(Math.floor(ease * value));

            if (percentage < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(value);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(count)}</>;
};

const AnimatedNumber = ({ value }: { value: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        const duration = 1500;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = currentTime - startTime;
            const percentage = Math.min(progress / duration, 1);
             const ease = 1 - Math.pow(1 - percentage, 4);

            setCount(Math.floor(ease * value));

            if (percentage < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(value);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    return <>{count}</>;
};

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }: any) => {
    if (active && payload && payload.length && label) {
        let formattedDate = label;
        try {
            const dateObj = new Date(label);
            if (!isNaN(dateObj.getTime())) {
                formattedDate = format(dateObj, 'dd MMMM yyyy', { locale: idLocale });
            }
        } catch (e) {
            // keep original label
        }

        return (
            <div className="bg-background/80 backdrop-blur-md border border-border/50 p-4 rounded-xl shadow-xl ring-1 ring-black/5">
                <p className="text-xs font-medium text-muted-foreground mb-1">{formattedDate}</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-8 rounded-full bg-primary" />
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">{payload[0].name === 'total' ? 'Pendapatan' : payload[0].name}</p>
                        <p className="text-lg font-bold text-foreground">
                            {prefix}{new Intl.NumberFormat('id-ID').format(payload[0].value)}{suffix}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function ReportsIndex({ summary, dailyRevenue, topServices, transactions, heatmapData, targetData, filters }: any) {
    const [date, setDate] = useState<DateRange | undefined>({
        from: filters.start_date ? new Date(filters.start_date) : undefined,
        to: filters.end_date ? new Date(filters.end_date) : undefined,
    });

    const [isFiltering, setIsFiltering] = useState(false);

    const applyFilter = (fromDate: Date | undefined, toDate: Date | undefined, customService?: string) => {
        setIsFiltering(true);
        router.get(route('reports.index'), { 
            start_date: fromDate ? format(fromDate, 'yyyy-MM-dd') : '', 
            end_date: toDate ? format(toDate, 'yyyy-MM-dd') : '',
            service_name: customService ?? filters.service_name // Use custom or existing
        }, { 
            preserveState: true,
            preserveScroll: true,
            replace: true, // SPA feel
            onFinish: () => setIsFiltering(false)
        });
    };

    const handleFilter = (customService?: string) => {
        applyFilter(date?.from, date?.to, customService);
    };

    const handleReset = () => {
        setDate(undefined);
        setIsFiltering(true);
        router.get(route('reports.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsFiltering(false)
        });
    };

    const setPreset = (days: number) => {
        const to = new Date();
        const from = subDays(new Date(), days);
        setDate({ from, to });
        // Immediately apply filter
        applyFilter(from, to);
    };

    const handleExport = () => {
        const url = route('reports.export', { 
            start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '', 
            end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '' 
        });
        window.location.href = url;
    };

    const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    const translateStatus = (status: string) => {
        const map: Record<string, string> = {
            'new': 'Baru',
            'process': 'Proses',
            'ready': 'Siap Ambil',
            'done': 'Selesai',
            'cancelled': 'Batal',
            'unpaid': 'Belum Bayar',
            'paid': 'Lunas',
        };
        return map[status] || status;
    };

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
            id: "services",
            header: "Layanan",
            cell: ({ row }) => {
                const details = row.original.details || [];
                const names = details.map((d: any) => d.service_name).join(", ");
                return <div className="text-xs text-muted-foreground max-w-[150px] truncate" title={names}>{names}</div>
            }
        },
        {
            accessorKey: "final_amount",
            header: "Total",
            cell: ({ row }) => <div className="font-bold text-sm text-emerald-600">{formatRupiah(row.getValue("final_amount"))}</div>
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
                if (status === 'done') variant = "default"; // solid black/primary
                if (status === 'process') variant = "secondary";
                if (status === 'cancelled') variant = "destructive";
                
                return <Badge variant={variant} className="capitalize text-[10px]">{translateStatus(status)}</Badge>
            }
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring" as const, stiffness: 100 }
        }
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <style>{styles}</style>
            <Head title="Laporan Keuangan" />

            <div className="flex flex-col gap-6 mb-8">
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Laporan Keuangan</h2>
                        <p className="text-muted-foreground">Analisis performa bisnis dan arus kas laundry Anda.</p>
                    </div>
                </motion.div>
                
                {/* Unified Filter Toolbar */}
                <motion.div variants={itemVariants} className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-background/60 backdrop-blur-sm border rounded-xl p-3 shadow-sm sticky top-4 z-30 ring-1 ring-border/50">
                    {/* Left: Presets & Date Pickers */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                        <div className="flex items-center bg-muted/50 p-1 rounded-lg border w-full sm:w-auto justify-center sm:justify-start">
                            <button onClick={() => setPreset(0)} className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground">Hari Ini</button>
                            <button onClick={() => setPreset(7)} className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground">7 Hari</button>
                            <button onClick={() => setPreset(30)} className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-background hover:shadow-sm transition-all text-muted-foreground hover:text-foreground">30 Hari</button>
                        </div>
                        <div className="hidden sm:block text-muted-foreground/20">|</div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="date" variant={"outline"} className={cn("w-full sm:w-[260px] justify-start text-left font-normal h-10", !date && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? <>{format(date.from, "dd MMM yyyy")} - {format(date.to, "dd MMM yyyy")}</> : format(date.from, "dd MMM yyyy")
                                    ) : <span>Pilih Tanggal</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
                        <Button size="sm" onClick={() => handleFilter()} disabled={isFiltering} className="h-10 px-5 shadow-lg shadow-primary/20">
                            {isFiltering ? 'Memuat...' : 'Terapkan Filter'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleReset} title="Reset Filter" className="h-10 w-10 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"><FilterX className="h-4 w-4"/></Button>
                        <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>
                        <Button size="sm" variant="outline" onClick={handleExport} className="h-10 gap-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5">
                            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export Excel</span>
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Target Progress Section */}
            {targetData && (
                <motion.div variants={itemVariants}>
                    <TargetProgress current={targetData.current} target={targetData.target} progress={targetData.progress} />
                </motion.div>
            )}

            {/* Ringkasan Cards */}
            <div className="grid gap-6 md:grid-cols-3 mb-8 mt-6">
                <motion.div variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                    <Card className="h-full border-l-4 border-l-emerald-500 shadow-md bg-gradient-to-br from-background to-emerald-500/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendapatan</CardTitle>
                                <div className="text-2xl font-bold text-foreground">
                                    {isFiltering ? <Skeleton className="h-8 w-32" /> : <AnimatedCounter value={summary.revenue} />}
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mt-2">
                                <TrendBadge value={summary.revenue_growth} />
                                <span className="text-xs text-muted-foreground">vs periode lalu</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                    <Card className="h-full border-l-4 border-l-blue-500 shadow-md bg-gradient-to-br from-background to-blue-500/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Transaksi</CardTitle>
                                <div className="text-2xl font-bold text-foreground">
                                    {isFiltering ? <Skeleton className="h-8 w-24" /> : <AnimatedNumber value={summary.transactions_count} />}
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
                                <ShoppingBag className="h-6 w-6" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mt-2">
                                <TrendBadge value={summary.transactions_growth} />
                                <span className="text-xs text-muted-foreground">vs periode lalu</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                    <Card className="h-full border-l-4 border-l-orange-500 shadow-md bg-gradient-to-br from-background to-orange-500/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Pelanggan Baru</CardTitle>
                                <div className="text-2xl font-bold text-foreground">
                                    {isFiltering ? <Skeleton className="h-8 w-24" /> : <AnimatedNumber value={summary.customers_new} />}
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 text-white">
                                <Users className="h-6 w-6" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mt-2">
                                <TrendBadge value={summary.customers_growth} />
                                <span className="text-xs text-muted-foreground">vs periode lalu</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <div className="space-y-8">
                {/* Heatmap Activity */}
                <motion.div variants={itemVariants}>
                    <Card className="border-none shadow-md overflow-hidden bg-gradient-to-b from-card to-muted/30">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Activity className="h-5 w-5 text-primary" /> Aktivitas Transaksi
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">Intensitas transaksi harian selama satu tahun terakhir.</p>
                                </div>
                                {/* Legend */}
                                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg border">
                                    <span>Sepi</span>
                                    <div className="flex gap-1">
                                        <div className="w-3 h-3 bg-muted rounded-sm ring-1 ring-border" title="0 Transaksi"></div>
                                        <div className="w-3 h-3 bg-primary/25 rounded-sm" title="1 Transaksi"></div>
                                        <div className="w-3 h-3 bg-primary/50 rounded-sm" title="2-3 Transaksi"></div>
                                        <div className="w-3 h-3 bg-primary/75 rounded-sm" title="> 4 Transaksi"></div>
                                        <div className="w-3 h-3 bg-primary rounded-sm shadow-sm shadow-primary/50" title="Sangat Ramai"></div>
                                    </div>
                                    <span>Ramai</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-x-auto pb-8 pt-2">
                            <div className="min-w-[700px]">
                                <CalendarHeatmap
                                    startDate={subDays(new Date(), 365)}
                                    endDate={new Date()}
                                    values={heatmapData}
                                    classForValue={(value: any) => {
                                        if (!value) { return 'color-empty'; }
                                        return `color-scale-${Math.min(value.count, 4)}`;
                                    }}
                                    tooltipDataAttrs={(value: any) => {
                                        if (!value || !value.date) { return { 'data-tip': 'Tidak ada data' }; }
                                        return { 'data-tip': `${format(new Date(value.date), 'dd MMM yyyy')}: ${value.count} Transaksi` };
                                    }}
                                    showWeekdayLabels
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Grafik Pendapatan */}
                <motion.div variants={itemVariants}>
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle>Tren Pendapatan</CardTitle>
                            <p className="text-sm text-muted-foreground">Grafik pergerakan omset harian berdasarkan filter tanggal.</p>
                        </CardHeader>
                        <CardContent className="pl-0">
                            <div className="h-[400px]">
                                {dailyRevenue.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dailyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                                            <XAxis 
                                                dataKey="date" 
                                                tickFormatter={(val) => format(new Date(val), 'dd/MM')}
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={15}
                                                stroke="#888888"
                                            />
                                            <YAxis 
                                                tickFormatter={(val) => `${val/1000}k`}
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                width={60}
                                                stroke="#888888"
                                            />
                                            <Tooltip content={<CustomTooltip prefix="Rp " />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                            <Area 
                                                type="monotone" 
                                                dataKey="total" 
                                                stroke="#3b82f6" 
                                                strokeWidth={3} 
                                                fillOpacity={1} 
                                                fill="url(#colorRevenue)" 
                                                activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 bg-muted/10 rounded-lg">
                                        <TrendingUp className="h-10 w-10 mb-2" />
                                        <p>Belum ada data pendapatan</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Grafik Layanan Terlaris */}
                <motion.div variants={itemVariants}>
                    <Card className="border-none shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Top 5 Layanan Terlaris</CardTitle>
                                <p className="text-sm text-muted-foreground">Klik batang grafik untuk memfilter tabel di bawah.</p>
                            </div>
                            {filters.service_name && (
                                <Badge variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-white" onClick={() => handleFilter('')}>
                                    Filter: {filters.service_name} <FilterX className="h-3 w-3 ml-1" />
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] w-full">
                                {topServices.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            layout="vertical"
                                            data={topServices}
                                            margin={{ top: 0, right: 30, left: 40, bottom: 5 }}
                                            className="cursor-pointer"
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" opacity={0.5} />
                                            <XAxis type="number" hide />
                                            <YAxis 
                                                dataKey="service_name" 
                                                type="category" 
                                                width={200}
                                                tick={{ fontSize: 13, fontWeight: 500, fill: 'hsl(var(--foreground))' }}
                                                interval={0}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip 
                                                cursor={{ fill: 'transparent' }} 
                                                content={<CustomTooltip suffix=" Transaksi" />}
                                            />
                                            <Bar 
                                                dataKey="total_qty" 
                                                radius={[0, 6, 6, 0]} 
                                                barSize={40}
                                                onClick={(data: any) => handleFilter(data.service_name)}
                                            >
                                                {topServices.map((entry: any, index: number) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={COLORS[index % COLORS.length]} 
                                                        className="transition-all duration-300 hover:opacity-80 cursor-pointer outline-none focus:outline-none"
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 bg-muted/10 rounded-lg">
                                        <ShoppingBag className="h-10 w-10 mb-2" />
                                        <p>Belum ada data layanan</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Tabel Detail */}
                <motion.div variants={itemVariants}>
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle>Rincian Transaksi</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {filters.service_name 
                                    ? `Menampilkan transaksi untuk layanan "${filters.service_name}"`
                                    : "Daftar lengkap transaksi yang terjadi pada periode terpilih."}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns} data={transactions.data} pagination={transactions} />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}

ReportsIndex.layout = (page: any) => <AdminLayout children={page} />;