import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Separator } from '@/Components/ui/separator';
import { Badge } from '@/Components/ui/badge';
import { Printer, ArrowLeft, Calendar, User, Phone, Mail } from 'lucide-react';
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type TransactionDetail = {
    id: number;
    service_name: string;
    qty: number;
    price: string;
    subtotal: string;
};

type Transaction = {
    id: number;
    invoice_code: string;
    customer: { name: string; phone: string; email: string | null; address: string | null };
    user: { name: string };
    total_amount: string;
    discount_amount: string;
    final_amount: string;
    payment_method: string;
    payment_status: string;
    status: string;
    created_at: string;
    details: TransactionDetail[];
};

function TransactionShow({ transaction }: { transaction: Transaction }) {
    
    const formatRupiah = (val: string) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(val));

    return (
        <>
            <Head title={`Detail Transaksi ${transaction.invoice_code}`} />

            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" asChild>
                    <Link href={route('transactions.index')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold tracking-tight">Detail Transaksi</h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <span className="font-mono">{transaction.invoice_code}</span>
                        <span>•</span>
                        <Calendar className="h-3 w-3" /> 
                        {format(new Date(transaction.created_at), "dd MMMM yyyy HH:mm", { locale: idLocale })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => window.open(route('transactions.print', transaction.id), '_blank')}>
                        <Printer className="mr-2 h-4 w-4" /> Cetak Struk
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Kolom Kiri: Info & Status */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-md">Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Pembayaran</p>
                                <Badge variant={transaction.payment_status === 'paid' ? 'default' : 'destructive'} className="capitalize w-full justify-center py-1">
                                    {transaction.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                                </Badge>
                                <p className="text-xs text-center mt-1 text-muted-foreground capitalize">Via {transaction.payment_method}</p>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Cucian</p>
                                <Badge variant="outline" className="capitalize w-full justify-center py-1 border-primary text-primary">
                                    {transaction.status === 'new' ? 'Baru Masuk' : 
                                     transaction.status === 'process' ? 'Sedang Proses' :
                                     transaction.status === 'ready' ? 'Siap Ambil' : 'Selesai'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-md">Pelanggan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{transaction.customer.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{transaction.customer.phone}</span>
                            </div>
                            {transaction.customer.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{transaction.customer.email}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Alamat:</p>
                                <p className="leading-snug">{transaction.customer.address || '-'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-md">Kasir</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{transaction.user.name}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Kolom Kanan: Rincian Belanja */}
                <div className="md:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Rincian Layanan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted text-muted-foreground font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Layanan</th>
                                            <th className="px-4 py-3 text-center">Qty</th>
                                            <th className="px-4 py-3 text-right">Harga</th>
                                            <th className="px-4 py-3 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {transaction.details.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3">{item.service_name}</td>
                                                <td className="px-4 py-3 text-center">{parseFloat(item.qty.toString())}</td>
                                                <td className="px-4 py-3 text-right">{formatRupiah(item.price)}</td>
                                                <td className="px-4 py-3 text-right font-medium">{formatRupiah(item.subtotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <div className="w-full md:w-1/2 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total Kotor</span>
                                        <span>{formatRupiah(transaction.total_amount)}</span>
                                    </div>
                                    {parseFloat(transaction.discount_amount) > 0 && (
                                        <div className="flex justify-between text-sm text-emerald-600">
                                            <span>Diskon</span>
                                            <span>- {formatRupiah(transaction.discount_amount)}</span>
                                        </div>
                                    )}
                                    <Separator className="my-2" />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total Bayar</span>
                                        <span>{formatRupiah(transaction.final_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

TransactionShow.layout = (page: any) => <AdminLayout children={page} />;
export default TransactionShow;