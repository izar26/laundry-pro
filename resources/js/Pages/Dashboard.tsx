import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { SpotlightCard } from "@/Components/ui/spotlight-card";
import { 
    DollarSign, 
    Users, 
    CreditCard, 
    Activity, 
    ArrowUpRight, 
    ArrowDownRight,
    ShoppingBag,
    Clock,
    User
} from 'lucide-react';
import { 
    Area, 
    AreaChart, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';

// Komponen Pembantu
const StatCard = ({ title, value, icon: Icon, color, spotlight, desc }: any) => (
    <SpotlightCard className="h-full" spotlightColor={spotlight || "rgba(255, 255, 255, 0.2)"}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
        </CardContent>
    </SpotlightCard>
);

const Dashboard = ({ stats, chartData, recentTransactions }: any) => {
    
    const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    return (
        <>
            <Head title="Dashboard" />
            
            <div className="flex flex-col gap-6">
                {/* Stats Cards Row */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard 
                        title="Pendapatan Hari Ini" 
                        icon={DollarSign} 
                        value={formatRupiah(stats.revenue_today)} 
                        color="text-emerald-500"
                        spotlight="rgba(16, 185, 129, 0.2)"
                    />
                    <StatCard 
                        title="Pendapatan Bulan Ini" 
                        icon={CreditCard} 
                        value={formatRupiah(stats.revenue_month)} 
                        color="text-blue-500"
                        spotlight="rgba(59, 130, 246, 0.2)"
                    />
                    <StatCard 
                        title="Transaksi Aktif" 
                        icon={Activity} 
                        value={stats.trx_active} 
                        desc="Sedang diproses"
                        color="text-orange-500"
                        spotlight="rgba(249, 115, 22, 0.2)"
                    />
                    <StatCard 
                        title="Pelanggan Baru" 
                        icon={Users} 
                        value={`+${stats.customers_new_month}`} 
                        desc="Bulan ini"
                        color="text-purple-500"
                        spotlight="rgba(168, 85, 247, 0.2)"
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-7">
                    {/* Chart Section */}
                    <Card className="col-span-4 border-none shadow-md">
                        <CardHeader>
                            <CardTitle>Pendapatan 7 Hari Terakhir</CardTitle>
                            <CardDescription>
                                Tren pendapatan harian dari transaksi yang lunas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pl-0">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#888888" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false} 
                                        />
                                        <YAxis 
                                            stroke="#888888" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            tickFormatter={(value) => `${value / 1000}k`} 
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={((value: number) => formatRupiah(value)) as any}
                                            labelFormatter={(label) => label}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Transactions */}
                    <Card className="col-span-3 border-none shadow-md">
                        <CardHeader>
                            <CardTitle>Transaksi Terbaru</CardTitle>
                            <CardDescription>
                                5 pesanan terakhir yang masuk sistem.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {recentTransactions.map((transaction: any) => (
                                    <div key={transaction.id} className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                            {transaction.customer_name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div className="ml-4 space-y-1 flex-1 overflow-hidden">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-medium leading-none truncate pr-2">{transaction.customer_name}</p>
                                                <span className="font-bold text-sm shrink-0">{formatRupiah(transaction.final_amount)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                <p className="truncate w-32">{transaction.service_summary}</p>
                                                <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 ${
                                                    transaction.status === 'done' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 
                                                    transaction.status === 'ready' ? 'text-orange-600 border-orange-200 bg-orange-50' : 'text-blue-600 border-blue-200 bg-blue-50'
                                                }`}>
                                                    {transaction.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {recentTransactions.length === 0 && (
                                    <div className="text-center text-muted-foreground py-8 text-sm">
                                        Belum ada transaksi.
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-6 pt-4 border-t text-center">
                                <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-primary" asChild>
                                    <Link href={route('transactions.index')}>Lihat Semua Transaksi</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

// PERSISTENT LAYOUT CONFIG
Dashboard.layout = (page: React.ReactNode) => <AdminLayout children={page} />;

export default Dashboard;
