import { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
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
import { Plus, Pencil, Trash, MoreHorizontal, Loader2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { toast } from 'sonner';

// Tipe Data Customer
type Customer = {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    created_at: string;
};

// Komponen Form untuk Create/Edit
function CustomerForm({ 
    customer, 
    isOpen, 
    setIsOpen 
}: { 
    customer?: Customer | null, 
    isOpen: boolean, 
    setIsOpen: (open: boolean) => void 
}) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        phone: '',
        email: '',
        address: '',
    });

    useEffect(() => {
        if (customer) {
            setData({
                name: customer.name,
                phone: customer.phone,
                email: customer.email || '',
                address: customer.address || '',
            });
        } else {
            reset();
        }
        clearErrors();
    }, [customer, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                setIsOpen(false);
                reset();
                toast.success(customer ? 'Data pelanggan berhasil diperbarui.' : 'Pelanggan baru berhasil ditambahkan.');
            },
            onError: () => {
                toast.error('Terjadi kesalahan. Periksa input Anda.');
            }
        };

        if (customer) {
            put(route('customers.update', customer.id), options);
        } else {
            post(route('customers.store'), options);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{customer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}</DialogTitle>
                    <DialogDescription>
                        {customer 
                            ? 'Ubah informasi pelanggan di bawah ini.' 
                            : 'Masukkan informasi pelanggan baru untuk database.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama Lengkap <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            placeholder="Contoh: Budi Santoso"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className={errors.name ? 'border-destructive' : ''}
                            autoFocus
                        />
                        {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="phone">No. HP / WhatsApp <span className="text-red-500">*</span></Label>
                            <Input
                                id="phone"
                                placeholder="0812..."
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className={errors.phone ? 'border-destructive' : ''}
                            />
                            {errors.phone && <span className="text-xs text-destructive">{errors.phone}</span>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email (Opsional)</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="budi@example.com"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            {errors.email && <span className="text-xs text-destructive">{errors.email}</span>}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Alamat Lengkap</Label>
                        <Textarea
                            id="address"
                            placeholder="Jl. Mawar No. 12, Kel. Melati..."
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    </div>
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {customer ? 'Simpan Perubahan' : 'Simpan Pelanggan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function CustomersIndex({ customers }: { customers: { data: Customer[] } }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    
    // State untuk Alert Delete
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { delete: destroy, processing: isDeleting } = useForm({});

    const openCreateDialog = () => {
        setEditingCustomer(null);
        setIsDialogOpen(true);
    };

    const openEditDialog = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsDialogOpen(true);
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
    };

    const handleDelete = () => {
        if (deleteId) {
            destroy(route('customers.destroy', deleteId), {
                onSuccess: () => {
                    setDeleteId(null);
                    toast.success('Pelanggan berhasil dihapus dari database.');
                },
                onError: () => {
                    toast.error('Gagal menghapus pelanggan.');
                }
            });
        }
    };

    const columns: ColumnDef<Customer>[] = [
        {
            accessorKey: "name",
            header: "Nama Pelanggan",
            cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>
        },
        {
            accessorKey: "phone",
            header: "Kontak",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{row.getValue("phone")}</span>
                    {row.original.email && <span className="text-xs text-muted-foreground">{row.original.email}</span>}
                </div>
            )
        },
        {
            accessorKey: "address",
            header: "Alamat",
            cell: ({ row }) => {
                const address = row.getValue("address") as string;
                return <div className="max-w-[250px] truncate text-muted-foreground" title={address || ''}>{address || '-'}</div>
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const customer = row.original;
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
                                <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit Data
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => confirmDelete(customer.id)}
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
            <Head title="Manajemen Pelanggan" />

            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Data Pelanggan</h2>
                    <p className="text-muted-foreground">
                        Kelola data pelanggan dan riwayat informasi kontak mereka.
                    </p>
                </div>
                <Button onClick={openCreateDialog} size="lg">
                    <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan
                </Button>
            </div>

            <div className="mt-8">
                <DataTable columns={columns} data={customers.data} pagination={customers} searchKey="name" />
            </div>

            <CustomerForm 
                isOpen={isDialogOpen} 
                setIsOpen={setIsDialogOpen} 
                customer={editingCustomer} 
            />

            {/* Alert Dialog Delete */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Data pelanggan ini akan dihapus permanen dari server.
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

CustomersIndex.layout = (page: any) => <AdminLayout children={page} />;
export default CustomersIndex;
