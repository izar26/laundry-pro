import { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select"
import { Plus, Pencil, Trash, MoreHorizontal, Loader2, DollarSign } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { toast } from 'sonner';

// Tipe Data Service
type Service = {
    id: number;
    name: string;
    price: string;
    unit: string;
    description: string | null;
    created_at: string;
};

// Komponen Form untuk Create/Edit
function ServiceForm({ 
    service, 
    isOpen, 
    setIsOpen 
}: { 
    service?: Service | null, 
    isOpen: boolean, 
    setIsOpen: (open: boolean) => void 
}) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        price: '',
        unit: 'kg',
        description: '',
    });

    useEffect(() => {
        if (service) {
            setData({
                name: service.name,
                price: parseFloat(service.price).toString(),
                unit: service.unit,
                description: service.description || '',
            });
        } else {
            reset();
        }
        clearErrors();
    }, [service, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                setIsOpen(false);
                reset();
                toast.success(service ? 'Layanan berhasil diperbarui.' : 'Layanan baru ditambahkan.');
            },
            onError: () => {
                toast.error('Gagal menyimpan layanan. Periksa input Anda.');
            }
        };

        if (service) {
            put(route('services.update', service.id), options);
        } else {
            post(route('services.store'), options);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{service ? 'Edit Layanan' : 'Tambah Layanan Baru'}</DialogTitle>
                    <DialogDescription>
                        Atur nama, harga, dan satuan layanan laundry Anda.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama Layanan <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            placeholder="Contoh: Cuci Komplit (Cuci + Setrika)"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className={errors.name ? 'border-destructive' : ''}
                            autoFocus
                        />
                        {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="price">Harga <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="0"
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                    className={`pl-9 ${errors.price ? 'border-destructive' : ''}`}
                                />
                            </div>
                            {errors.price && <span className="text-xs text-destructive">{errors.price}</span>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="unit">Satuan <span className="text-red-500">*</span></Label>
                            <Select 
                                value={data.unit} 
                                onValueChange={(val) => setData('unit', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih satuan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kg">Per Kg</SelectItem>
                                    <SelectItem value="pcs">Per Potong (Pcs)</SelectItem>
                                    <SelectItem value="meter">Per Meter</SelectItem>
                                    <SelectItem value="set">Per Set</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.unit && <span className="text-xs text-destructive">{errors.unit}</span>}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Keterangan (Opsional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Detail layanan, estimasi waktu, dll..."
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    </div>
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {service ? 'Simpan Perubahan' : 'Simpan Layanan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ServicesIndex({ services }: { services: { data: Service[] } }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { delete: destroy, processing: isDeleting } = useForm({});

    const openCreateDialog = () => {
        setEditingService(null);
        setIsDialogOpen(true);
    };

    const openEditDialog = (service: Service) => {
        setEditingService(service);
        setIsDialogOpen(true);
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
    };

    const handleDelete = () => {
        if (deleteId) {
            destroy(route('services.destroy', deleteId), {
                onSuccess: () => {
                    setDeleteId(null);
                    toast.success('Layanan berhasil dihapus.');
                },
                onError: () => {
                    toast.error('Gagal menghapus layanan.');
                }
            });
        }
    };

    const columns: ColumnDef<Service>[] = [
        {
            accessorKey: "name",
            header: "Nama Layanan",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.getValue("name")}</span>
                    {row.original.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {row.original.description}
                        </span>
                    )}
                </div>
            )
        },
        {
            accessorKey: "price",
            header: "Harga",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("price"));
                const formatted = new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format(amount);
                return <div className="font-semibold">{formatted}</div>;
            }
        },
        {
            accessorKey: "unit",
            header: "Satuan",
            cell: ({ row }) => (
                <div className="capitalize badge bg-secondary px-2 py-1 rounded-md text-xs inline-block">
                    /{row.getValue("unit")}
                </div>
            )
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const service = row.original;
                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openEditDialog(service)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit Layanan
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => confirmDelete(service.id)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash className="mr-2 h-4 w-4" /> Hapus
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Manajemen Layanan" />

            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Daftar Layanan</h2>
                    <p className="text-muted-foreground">
                        Atur jenis layanan laundry dan harga satuan.
                    </p>
                </div>
                <Button onClick={openCreateDialog} size="lg">
                    <Plus className="mr-2 h-4 w-4" /> Tambah Layanan
                </Button>
            </div>

            <div className="mt-8">
                <DataTable columns={columns} data={services.data} pagination={services} searchKey="name" />
            </div>

            <ServiceForm 
                isOpen={isDialogOpen} 
                setIsOpen={setIsDialogOpen} 
                service={editingService} 
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Layanan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Layanan ini akan dihapus permanen. Transaksi lama yang menggunakan layanan ini mungkin akan kehilangan referensi nama layanan.
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

ServicesIndex.layout = (page: any) => <AdminLayout children={page} />;
export default ServicesIndex;