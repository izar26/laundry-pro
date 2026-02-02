import { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/Components/ui/data-table/data-table';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
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
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Switch } from "@/Components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Calendar } from "@/Components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Plus, Pencil, Trash, MoreHorizontal, Loader2, Calendar as CalendarIcon, Tag, Layers } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

// Tipe Data
type Service = { id: number; name: string };
type Promotion = {
    id: number;
    name: string;
    code: string | null;
    service_id: number | null;
    service?: { name: string };
    description: string | null;
    type: 'percentage' | 'fixed';
    value: string;
    min_weight: string | null;
    min_amount: string | null;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
};

// Komponen Toggle Status
const StatusToggle = ({ row, canManage }: { row: any, canManage: boolean }) => {
    const promo = row.original;
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = (checked: boolean) => {
        if (!canManage) return;

        setIsLoading(true);
        router.put(route('promotions.update', promo.id), {
            ...promo, // Kirim data lama agar validasi required backend tetap lolos
            is_active: checked,
            _method: 'PUT'
        }, {
            onSuccess: () => {
                toast.success(`Promo ${checked ? 'diaktifkan' : 'dinonaktifkan'}.`);
                setIsLoading(false);
            },
            onError: () => {
                toast.error("Gagal mengubah status.");
                setIsLoading(false);
            },
            preserveState: true, // PENTING: Mencegah skeleton
            preserveScroll: true
        });
    };

    return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Switch 
                checked={promo.is_active} 
                onCheckedChange={handleToggle} 
                disabled={isLoading || !canManage}
                className="scale-75" // Sedikit diperkecil agar pas di tabel
            />
            <span className={cn("text-xs", promo.is_active ? "text-emerald-600 font-medium" : "text-muted-foreground")}>
                {promo.is_active ? 'Aktif' : 'Mati'}
            </span>
        </div>
    );
};

function PromotionForm({ 
    promotion, 
    services,
    isOpen, 
    setIsOpen 
}: { 
    promotion?: Promotion | null, 
    services: Service[],
    isOpen: boolean, 
    setIsOpen: (open: boolean) => void 
}) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        code: '',
        service_id: 'all' as string | number,
        type: 'percentage',
        value: '',
        min_weight: '',
        min_amount: '',
        start_date: undefined as Date | undefined,
        end_date: undefined as Date | undefined,
        description: '',
        is_active: true,
    });

    useEffect(() => {
        if (promotion) {
            setData({
                name: promotion.name,
                code: promotion.code || '',
                service_id: promotion.service_id || 'all',
                type: promotion.type,
                value: parseFloat(promotion.value).toString(),
                min_weight: promotion.min_weight ? parseFloat(promotion.min_weight).toString() : '',
                min_amount: promotion.min_amount ? parseFloat(promotion.min_amount).toString() : '',
                start_date: promotion.start_date ? new Date(promotion.start_date) : undefined,
                end_date: promotion.end_date ? new Date(promotion.end_date) : undefined,
                description: promotion.description || '',
                is_active: promotion.is_active,
            });
        } else {
            reset();
            setData('is_active', true);
        }
        clearErrors();
    }, [promotion, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload = {
            ...data,
            service_id: data.service_id === 'all' ? null : data.service_id,
            start_date: data.start_date ? format(data.start_date, 'yyyy-MM-dd') : null,
            end_date: data.end_date ? format(data.end_date, 'yyyy-MM-dd') : null,
        };

        const options = {
            onSuccess: () => {
                setIsOpen(false);
                reset();
                toast.success('Promosi berhasil disimpan.');
            },
            onError: () => toast.error('Terjadi kesalahan.')
        };

        if (promotion) {
            // @ts-ignore
            put(route('promotions.update', promotion.id), { ...payload, onSuccess: options.onSuccess, onError: options.onError });
        } else {
            // @ts-ignore
            post(route('promotions.store'), { ...payload, onSuccess: options.onSuccess, onError: options.onError });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>{promotion ? 'Edit Promosi' : 'Buat Promosi Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 py-2">
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama Promo <span className="text-red-500">*</span></Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
                        </div>
                        
                        <div className="grid gap-2">
                            <Label>Berlaku Untuk Layanan</Label>
                            <Select 
                                value={data.service_id.toString()} 
                                onValueChange={(val) => setData('service_id', val === 'all' ? 'all' : parseInt(val))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Layanan</SelectItem>
                                    {services.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="code">Kode Voucher (Opsional)</Label>
                            <Input id="code" placeholder="KODE" value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} className="uppercase font-mono" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Tipe</Label>
                                <Select value={data.type} onValueChange={(val: any) => setData('type', val)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Persentase (%)</SelectItem>
                                        <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Nilai</Label>
                                <Input type="number" value={data.value} onChange={(e) => setData('value', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 border-l pl-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Min. Berat (Kg)</Label>
                                <Input type="number" value={data.min_weight} onChange={(e) => setData('min_weight', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Min. Transaksi (Rp)</Label>
                                <Input type="number" value={data.min_amount} onChange={(e) => setData('min_amount', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Periode</Label>
                            <div className="grid gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="justify-start font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {data.start_date ? format(data.start_date, "dd MMM yyyy") : "Mulai"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={data.start_date} onSelect={(d) => setData('start_date', d)} /></PopoverContent>
                                </Popover>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="justify-start font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {data.end_date ? format(data.end_date, "dd MMM yyyy") : "Selesai"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={data.end_date} onSelect={(d) => setData('end_date', d)} /></PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Switch checked={data.is_active} onCheckedChange={(c) => setData('is_active', c)} />
                            <Label>Status Aktif</Label>
                        </div>
                    </div>

                    <DialogFooter className="col-span-2 pt-4 border-t">
                        <Button type="submit" disabled={processing}>{promotion ? 'Simpan' : 'Buat'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function PromotionsIndex({ promotions, services, canManagePromotions = false }: { promotions: { data: Promotion[] }, services: Service[], canManagePromotions?: boolean }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { delete: destroy } = useForm({});

    const columns: ColumnDef<Promotion>[] = [
        {
            accessorKey: "name",
            header: "Nama Promosi",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.getValue("name")}</span>
                    <div className="flex gap-1 mt-1">
                        {row.original.code && <Badge variant="outline" className="text-[10px] font-mono">CODE: {row.original.code}</Badge>}
                        {row.original.service ? (
                            <Badge variant="secondary" className="text-[10px]"><Layers className="w-2 h-2 mr-1"/> {row.original.service.name}</Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px]">Semua Layanan</Badge>
                        )}
                    </div>
                </div>
            )
        },
        {
            accessorKey: "value",
            header: "Diskon",
            cell: ({ row }) => (
                <div className="font-bold text-emerald-600">
                    {row.original.type === 'percentage' ? `${parseFloat(row.original.value)}%` : `Rp${parseFloat(row.original.value).toLocaleString()}`}
                </div>
            )
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => <StatusToggle row={row} canManage={canManagePromotions} />
        },
    ];

    if (canManagePromotions) {
        columns.push({
            id: "actions",
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingPromo(row.original); setIsDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteId(row.original.id)} className="text-destructive"><Trash className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        });
    }

    return (
        <>
            <Head title="Manajemen Promosi" />
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Promosi</h2>
                    <p className="text-muted-foreground">Kelola diskon layanan laundry.</p>
                </div>
                {canManagePromotions && (
                    <Button onClick={() => { setEditingPromo(null); setIsDialogOpen(true); }} size="lg"><Plus className="mr-2 h-4 w-4" /> Buat Promo</Button>
                )}
            </div>
            <div className="mt-8"><DataTable columns={columns} data={promotions.data} pagination={promotions} searchKey="name" /></div>
            
            {canManagePromotions && (
                <>
                    <PromotionForm isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} promotion={editingPromo} services={services} />
                    <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Hapus?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => destroy((route('promotions.destroy', deleteId || 0) as unknown) as string, { onSuccess: () => setDeleteId(null) })} className="bg-destructive">Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </>
    );
}

PromotionsIndex.layout = (page: any) => <AdminLayout children={page} />;
export default PromotionsIndex;