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
import { SimpleCalendar as Calendar } from "@/Components/ui/simple-calendar";
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
import type { DateRange } from 'react-day-picker';

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
            preserveState: true,
            preserveScroll: true
        });
    };

    return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Switch 
                checked={promo.is_active} 
                onCheckedChange={handleToggle} 
                disabled={isLoading || !canManage}
                className="scale-75"
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
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        service_id: 'all' as string | number,
        type: 'percentage',
        value: '',
        min_weight: '',
        min_amount: '',
        description: '',
        is_active: true,
    });

    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (promotion) {
            setFormData({
                name: promotion.name,
                code: promotion.code || '',
                service_id: promotion.service_id || 'all',
                type: promotion.type,
                value: parseFloat(promotion.value).toString(),
                min_weight: promotion.min_weight ? parseFloat(promotion.min_weight).toString() : '',
                min_amount: promotion.min_amount ? parseFloat(promotion.min_amount).toString() : '',
                description: promotion.description || '',
                is_active: promotion.is_active,
            });
            setDateRange({
                from: promotion.start_date ? new Date(promotion.start_date + 'T00:00:00') : undefined,
                to: promotion.end_date ? new Date(promotion.end_date + 'T00:00:00') : undefined,
            });
        } else {
            setFormData({
                name: '', code: '', service_id: 'all', type: 'percentage',
                value: '', min_weight: '', min_amount: '', description: '', is_active: true,
            });
            setDateRange(undefined);
        }
        setFormErrors({});
    }, [promotion, isOpen]);

    const setField = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            ...formData,
            service_id: formData.service_id === 'all' ? null : formData.service_id,
            start_date: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
            end_date: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
            min_weight: formData.min_weight || null,
            min_amount: formData.min_amount || null,
            code: formData.code || null,
            description: formData.description || null,
        };

        const options = {
            onSuccess: () => {
                setIsOpen(false);
                toast.success('Promosi berhasil disimpan.');
                setIsSubmitting(false);
            },
            onError: (errors: any) => {
                console.error('=== PROMO FORM ERRORS ===', errors);
                console.error('=== PAYLOAD SENT ===', payload);
                setFormErrors(errors);
                const errorMessages = Object.values(errors).flat().join(', ');
                toast.error('Gagal: ' + (errorMessages || JSON.stringify(errors)));
                setIsSubmitting(false);
            },
            preserveScroll: true,
        };

        if (promotion) {
            router.put(route('promotions.update', promotion.id), payload, options);
        } else {
            router.post(route('promotions.store'), payload, options);
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
                            <Input id="name" value={formData.name} onChange={(e) => setField('name', e.target.value)} />
                            {formErrors.name && <span className="text-xs text-destructive">{formErrors.name}</span>}
                        </div>
                        
                        <div className="grid gap-2">
                            <Label>Berlaku Untuk Layanan</Label>
                            <Select 
                                value={formData.service_id.toString()} 
                                onValueChange={(val) => setField('service_id', val === 'all' ? 'all' : parseInt(val))}
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
                            <Input id="code" placeholder="KODE" value={formData.code} onChange={(e) => setField('code', e.target.value.toUpperCase())} className="uppercase font-mono" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Tipe</Label>
                                <Select value={formData.type} onValueChange={(val: any) => setField('type', val)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Persentase (%)</SelectItem>
                                        <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Nilai <span className="text-red-500">*</span></Label>
                                <Input type="number" value={formData.value} onChange={(e) => setField('value', e.target.value)} />
                                {formErrors.value && <span className="text-xs text-destructive">{formErrors.value}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 border-l pl-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Min. Berat (Kg)</Label>
                                <Input type="number" value={formData.min_weight} onChange={(e) => setField('min_weight', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Min. Transaksi (Rp)</Label>
                                <Input type="number" value={formData.min_amount} onChange={(e) => setField('min_amount', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Periode Promo</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start font-normal", !dateRange && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                <>{format(dateRange.from, "dd MMM yyyy", { locale: idLocale })} — {format(dateRange.to, "dd MMM yyyy", { locale: idLocale })}</>
                                            ) : (
                                                format(dateRange.from, "dd MMM yyyy", { locale: idLocale })
                                            )
                                        ) : (
                                            "Pilih rentang tanggal"
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="range" selected={dateRange} onSelect={setDateRange} />
                                </PopoverContent>
                            </Popover>
                            <p className="text-[10px] text-muted-foreground">Kosongkan jika promo berlaku selamanya.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label>Deskripsi (Opsional)</Label>
                            <Input value={formData.description} onChange={(e) => setField('description', e.target.value)} placeholder="Keterangan singkat..." />
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Switch checked={formData.is_active} onCheckedChange={(c) => setField('is_active', c)} />
                            <Label>Status Aktif</Label>
                        </div>
                    </div>

                    <DialogFooter className="col-span-2 pt-4 border-t">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {promotion ? 'Simpan Perubahan' : 'Buat Promo'}
                        </Button>
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