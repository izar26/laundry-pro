import { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/Components/ui/data-table/data-table';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Plus, Printer, RefreshCw, Pencil, MoreHorizontal, Eye, Trash, Loader2, CreditCard, Banknote, Calendar, TrendingUp, AlertCircle, Clock, CheckCircle2, LayoutList, Kanban as LayoutKanban, Search, XCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Input } from '@/Components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/Components/ui/alert-dialog";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { SpotlightCard } from "@/Components/ui/spotlight-card";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import KanbanBoard from './KanbanBoard';

// ... (Type definitions & StatusCell component sama seperti sebelumnya) ...
// Saya akan menyingkat bagian helper function/types agar tidak terlalu panjang di chat,
// tapi di file aslinya tetap ada.

// Tipe Data
type Transaction = {
    id: number;
    invoice_code: string;
    customer: { 
        user_id: number;
        user: { 
            name: string 
        } 
    };
    user_id: number;
    user: { id: number; name: string }; // Kasir
    total_amount: string;
    final_amount: string;
    payment_method: string;
    payment_status: string;
    status: string;
    created_at: string;
    snap_token: string | null;
};

type Stats = {
    revenue_today: number;
    trx_today: number;
    unpaid_count: number;
    process_count: number;
};

declare global {
    interface Window {
        snap: any;
    }
}

const StatusCell = ({ row, isReadOnly = false }: { row: any, isReadOnly?: boolean }) => {
    const transaction = row.original;
    const [loading, setLoading] = useState(false);

    const handleStatusChange = (newStatus: string) => {
        if (isReadOnly) return;
        setLoading(true);
        router.patch(route('transactions.status', transaction.id), {
            status: newStatus
        }, {
            onSuccess: () => {
                toast.success(`Status diperbarui.`);
                setLoading(false);
            },
            onError: () => {
                toast.error("Gagal.");
                setLoading(false);
            },
            preserveState: true,
            preserveScroll: true
        });
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'pending': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
            case 'new': return 'bg-slate-500 hover:bg-slate-600 text-white';
            case 'process': return 'bg-blue-500 hover:bg-blue-600 text-white';
            case 'ready': return 'bg-orange-500 hover:bg-orange-600 text-white';
            case 'done': return 'bg-emerald-600 hover:bg-emerald-700 text-white';
            case 'cancelled': return 'bg-red-500 hover:bg-red-600 text-white';
            default: return 'bg-gray-500';
        }
    };

    const statusLabels: Record<string, string> = {
        pending: 'Menunggu',
        new: 'Baru Masuk',
        process: 'Sedang Proses',
        ready: 'Siap Ambil',
        done: 'Selesai',
        cancelled: 'Dibatalkan',
    };

    if (isReadOnly) {
        return (
            <Badge className={cn("w-[110px] h-7 text-[10px] flex justify-center border-none", getStatusColor(transaction.status))}>
                {statusLabels[transaction.status] || transaction.status}
            </Badge>
        );
    }

    return (
        <Select defaultValue={transaction.status} onValueChange={handleStatusChange} disabled={loading}>
            <SelectTrigger className={`w-[110px] h-7 text-xs border-none font-medium ${getStatusColor(transaction.status)}`}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="new">Baru Masuk</SelectItem>
                <SelectItem value="process">Sedang Proses</SelectItem>
                <SelectItem value="ready">Siap Ambil</SelectItem>
                <SelectItem value="done">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
        </Select>
    );
};

const TransactionsIndex = ({ transactions, kanbanData, stats, filters }: { transactions: { data: Transaction[] }, kanbanData: Transaction[], stats: Stats, filters: any }) => {
    
    const { midtrans_client_key, midtrans_is_production, auth } = usePage().props as any;
    const user = auth.user;
    const isPelanggan = user.roles?.includes('pelanggan');
    const isOwner = user.roles?.includes('owner');
    // Read Only Status: Pelanggan DAN Owner
    const isReadOnlyStatus = isPelanggan || isOwner;
    
    const canViewCreator = user.roles?.includes('admin') || user.roles?.includes('owner') || user.roles?.includes('pegawai');
    const canCreateTransaction = !isOwner; // Owner read-only, sisanya boleh (Admin, Pegawai, Pelanggan)

    const [isChecking, setIsChecking] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { delete: destroy, processing: isDeleting } = useForm({});

    const [searchValue, setSearchValue] = useState(filters.search || "");

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue !== (filters.search || "")) {
                router.get(
                    route('transactions.index'), 
                    { ...filters, search: searchValue, page: 1 },
                    { preserveState: true, replace: true }
                )
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [searchValue]);

    const currentView = filters.view || 'list';
    const currentStatus = filters.status || 'all';

    useEffect(() => {
        if (!midtrans_client_key) return;
        const baseUrl = midtrans_is_production 
            ? "https://app.midtrans.com/snap/snap.js" 
            : "https://app.sandbox.midtrans.com/snap/snap.js";
        const script = document.createElement("script");
        script.src = baseUrl;
        script.setAttribute("data-client-key", midtrans_client_key);
        script.async = true;
        document.body.appendChild(script);
        return () => { if (document.body.contains(script)) document.body.removeChild(script); };
    }, [midtrans_client_key, midtrans_is_production]);

    const handleCheckStatus = (id: number) => {
        setIsChecking(id);
        router.get(route('transactions.check-status', id), {}, {
            preserveState: true,
            onFinish: () => setIsChecking(null)
        });
    };

    const handlePayAgain = (token: string) => {
        if (window.snap) {
            window.snap.pay(token, {
                onSuccess: function(result: any){
                    toast.success("Pembayaran Berhasil!");
                    router.reload();
                },
                onPending: function(result: any){
                    toast.info("Menunggu pembayaran...");
                },
                onError: function(result: any){
                    toast.error("Pembayaran gagal!");
                }
            });
        } else {
            toast.error("Gagal memuat sistem pembayaran. Refresh halaman.");
        }
    };

    const handleDelete = () => {
        if (deleteId) {
            destroy(route('transactions.destroy', deleteId), {
                onSuccess: () => {
                    setDeleteId(null);
                },
                onError: () => toast.error('Gagal menghapus transaksi.')
            });
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, spotlight }: any) => (
        <SpotlightCard className="h-full" spotlightColor={spotlight || "rgba(255, 255, 255, 0.2)"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </SpotlightCard>
    );

    const columns: ColumnDef<Transaction>[] = [
        {
            accessorKey: "invoice_code",
            header: "Transaksi",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <span className="font-mono font-bold text-xs group-hover:text-primary transition-colors">{row.getValue("invoice_code")}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(row.original.created_at), "dd MMM, HH:mm", { locale: idLocale })}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "customer.user.name",
            header: "Pelanggan",
            cell: ({ row }) => <div className="font-medium text-sm">{row.original.customer.user?.name || 'Umum'}</div>
        },
        // Kolom Kasir (Hanya untuk Admin/Owner/Pegawai)
        ...(canViewCreator ? [{
            accessorKey: "user.name",
            header: "Dibuat Oleh",
            cell: ({ row }: { row: any }) => {
                const creatorId = row.original.user?.id;
                const customerUserId = row.original.customer?.user_id;
                const isCreatedByCustomer = creatorId === customerUserId;

                return (
                    <div className="flex items-center gap-2">
                        <div className="font-medium text-sm text-muted-foreground">
                            {isCreatedByCustomer ? 'Pelanggan' : row.original.user?.name}
                        </div>
                    </div>
                );
            }
        }] : []),
        {
            accessorKey: "final_amount",
            header: "Total",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("final_amount"));
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)}</span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground capitalize">
                            {row.original.payment_method === 'cash' ? <Banknote className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                            {row.original.payment_method}
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "payment_status",
            header: "Pembayaran",
            cell: ({ row }) => {
                const status = row.getValue("payment_status") as string;
                return (
                    <Badge variant={status === 'paid' ? 'outline' : 'destructive'} className={cn("capitalize text-[10px]", status === 'paid' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : '')}>
                        {status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                    </Badge>
                )
            }
        },
        {
            accessorKey: "status",
            header: "Status Cucian",
            cell: ({ row }) => <StatusCell row={row} isReadOnly={isReadOnlyStatus} />
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const transaction = row.original;
                return (
                    <div className="flex items-center gap-1 justify-end">
                        {transaction.payment_method === 'midtrans' && transaction.payment_status === 'unpaid' && transaction.snap_token && (
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100"
                                onClick={() => handlePayAgain(transaction.snap_token!)}
                                title="Bayar Sekarang"
                            >
                                <CreditCard className="h-3 w-3" />
                            </Button>
                        )}

                        {transaction.payment_method === 'midtrans' && transaction.payment_status === 'unpaid' && (
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 text-blue-600 border-blue-200"
                                onClick={() => handleCheckStatus(transaction.id)}
                                disabled={isChecking === transaction.id}
                                title="Cek Status"
                            >
                                <RefreshCw className={cn("h-3 w-3", isChecking === transaction.id && "animate-spin")} />
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-muted">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => window.open(route('transactions.print', transaction.id), '_blank')}>
                                    <Printer className="mr-2 h-4 w-4" /> Cetak Struk
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={route('transactions.show', transaction.id)}>
                                        <Eye className="mr-2 h-4 w-4" /> Detail
                                    </Link>
                                </DropdownMenuItem>
                                
                                {isPelanggan && transaction.status === 'pending' && (
                                    <DropdownMenuItem onClick={() => {
                                        if (confirm('Yakin ingin membatalkan pesanan ini?')) {
                                            router.patch(route('transactions.cancel', transaction.id));
                                        }
                                    }} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                        <XCircle className="mr-2 h-4 w-4" /> Batalkan Pesanan
                                    </DropdownMenuItem>
                                )}

                                {!isPelanggan && !isOwner && (
                                    <DropdownMenuItem onClick={() => setDeleteId(transaction.id)} className="text-destructive">
                                        <Trash className="mr-2 h-4 w-4" /> Hapus
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            }
        }
    ];

    return (
        <>
            <Head title="Riwayat Transaksi" />
            
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <StatCard 
                    title="Omset Hari Ini" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.revenue_today)} 
                    icon={TrendingUp} 
                    color="text-emerald-500"
                    spotlight="rgba(16, 185, 129, 0.2)"
                />
                <StatCard 
                    title="Transaksi Hari Ini" 
                    value={stats.trx_today} 
                    icon={CheckCircle2} 
                    color="text-blue-500"
                    spotlight="rgba(59, 130, 246, 0.2)"
                />
                <StatCard 
                    title="Perlu Diproses" 
                    value={stats.process_count} 
                    icon={Clock} 
                    color="text-orange-500"
                    spotlight="rgba(249, 115, 22, 0.2)"
                />
                <StatCard 
                    title="Belum Lunas" 
                    value={stats.unpaid_count} 
                    icon={AlertCircle} 
                    color="text-red-500"
                    spotlight="rgba(239, 68, 68, 0.2)"
                />
            </div>

            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full xl:w-auto">
                    {/* View Toggle */}
                    <div className="flex bg-muted rounded-lg p-1 shrink-0">
                        <Link
                            href={route('transactions.index', { ...filters, view: 'list' })}
                            className={cn("px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2", currentView === 'list' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                        >
                            <LayoutList className="h-4 w-4" /> List
                        </Link>
                        <Link
                            href={route('transactions.index', { ...filters, view: 'board' })}
                            className={cn("px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2", currentView === 'board' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                        >
                            <LayoutKanban className="h-4 w-4" /> Board
                        </Link>
                    </div>

                    {/* Search & Filter Group */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-[250px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari invoice/nama..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>

                        {currentView === 'list' && (
                            <Select 
                                value={currentStatus} 
                                onValueChange={(val) => router.get(route('transactions.index', { ...filters, status: val, page: 1 }))}
                            >
                                <SelectTrigger className="w-[140px] h-9">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="unpaid">Belum Lunas</SelectItem>
                                    <SelectItem value="pending">Menunggu</SelectItem>
                                    <SelectItem value="new">Baru Masuk</SelectItem>
                                    <SelectItem value="process">Sedang Proses</SelectItem>
                                    <SelectItem value="ready">Siap Ambil</SelectItem>
                                    <SelectItem value="done">Selesai</SelectItem>
                                    <SelectItem value="cancelled">Batal</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                {canCreateTransaction && (
                    <Button asChild size="lg" className="shadow-lg shadow-primary/20 w-full sm:w-auto">
                        <Link href={route('transactions.create')}>
                            <Plus className="mr-2 h-4 w-4" /> Transaksi Baru (POS)
                        </Link>
                    </Button>
                )}
            </div>

            {currentView === 'list' ? (
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    <DataTable columns={columns} data={transactions.data} pagination={transactions} />
                </div>
            ) : (
                <div className="h-[600px]">
                    <KanbanBoard transactions={kanbanData} />
                </div>
            )}

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Data transaksi ini akan dihapus permanen. Laporan keuangan akan berubah.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => { e.preventDefault(); handleDelete(); }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

TransactionsIndex.layout = (page: any) => <AdminLayout children={page} />;
export default TransactionsIndex;