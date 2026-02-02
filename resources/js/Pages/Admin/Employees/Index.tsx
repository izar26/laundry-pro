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
import { Plus, Pencil, Trash, MoreHorizontal, Loader2, User as UserIcon } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';

// Tipe Data User/Employee
type Employee = {
    id: number;
    user_id: number;
    phone?: string;
    address?: string;
    nip?: string;
    position?: string;
    salary?: number;
    join_date?: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
        roles: { name: string }[];
    }
};

function EmployeeForm({ 
    employee, 
    isOpen, 
    setIsOpen 
}: { 
    employee?: Employee | null, 
    isOpen: boolean, 
    setIsOpen: (open: boolean) => void 
}) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
    });

    useEffect(() => {
        if (employee) {
            setData({
                name: employee.user.name,
                email: employee.user.email,
                password: '',
                phone: employee.phone || '',
                address: employee.address || '',
            });
        } else {
            reset();
        }
        clearErrors();
    }, [employee, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                setIsOpen(false);
                reset();
                toast.success(employee ? 'Data pegawai diperbarui.' : 'Pegawai baru ditambahkan.');
            },
            onError: () => {
                toast.error('Gagal menyimpan data pegawai.');
            }
        };

        if (employee) {
            put(route('employees.update', employee.id), options);
        } else {
            post(route('employees.store'), options);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{employee ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}</DialogTitle>
                    <DialogDescription>
                        Pegawai baru akan otomatis mendapatkan role "Pegawai" dan bisa login ke sistem.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama Lengkap <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            placeholder="Nama Pegawai"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email Login <span className="text-red-500">*</span></Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="pegawai@laundry.test"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className={errors.email ? 'border-destructive' : ''}
                        />
                        {errors.email && <span className="text-xs text-destructive">{errors.email}</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Nomor HP</Label>
                        <Input
                            id="phone"
                            placeholder="0812xxxx"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Alamat</Label>
                        <Textarea
                            id="address"
                            placeholder="Jl. Alamat Pegawai..."
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">
                            {employee ? 'Password Baru (Opsional)' : 'Password'} {employee ? '' : <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder={employee ? 'Biarkan kosong jika tidak ingin mengubah' : 'Minimal 8 karakter'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className={errors.password ? 'border-destructive' : ''}
                        />
                         {employee && <p className="text-[10px] text-muted-foreground">Isi hanya jika ingin mereset password pegawai ini.</p>}
                        {errors.password && <span className="text-xs text-destructive">{errors.password}</span>}
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {employee ? 'Simpan Perubahan' : 'Tambah Pegawai'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EmployeesIndex({ employees }: { employees: { data: Employee[] } }) {
    const { auth } = usePage().props as any;
    const currentUser = auth.user;
    // Cek apakah user adalah Owner (Read Only)
    const isOwner = currentUser.roles?.includes('owner');
    // Admin boleh manage, Owner tidak boleh
    const canManageEmployees = !isOwner;

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { delete: destroy, processing: isDeleting } = useForm({});

    const openCreateDialog = () => {
        setEditingEmployee(null);
        setIsDialogOpen(true);
    };

    const openEditDialog = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsDialogOpen(true);
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
    };

    const handleDelete = () => {
        if (deleteId) {
            destroy(route('employees.destroy', deleteId), {
                onSuccess: () => {
                    setDeleteId(null);
                    toast.success('Akun pegawai dihapus.');
                },
                onError: () => toast.error('Gagal menghapus akun.')
            });
        }
    };

    const columns: ColumnDef<Employee>[] = [
        {
            accessorKey: "user.name",
            header: "Nama Pegawai",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={row.original.user.avatar ? `/storage/${row.original.user.avatar}` : `https://ui-avatars.com/api/?name=${row.original.user.name}&background=random`} />
                        <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{row.original.user.name}</span>
                            {row.original.position === 'Owner' && (
                                <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-purple-600 hover:bg-purple-700">Owner</Badge>
                            )}
                            {row.original.position === 'Administrator' && (
                                <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-blue-600 hover:bg-blue-700">Admin</Badge>
                            )}
                        </div>
                        {row.original.user.id === currentUser.id && (
                            <span className="text-[10px] text-muted-foreground">It's You</span>
                        )}
                    </div>
                </div>
            )
        },
        {
            accessorKey: "user.email",
            header: "Email",
        },
    ];

    if (canManageEmployees) {
        columns.push({
            id: "actions",
            cell: ({ row }) => {
                const employee = row.original;
                const isMe = employee.user.id === currentUser.id;

                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(employee)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit Data
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => confirmDelete(employee.id)} 
                                    className="text-destructive"
                                    disabled={isMe}
                                >
                                    <Trash className="mr-2 h-4 w-4" /> Hapus Akun
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        });
    }

    return (
        <>
            <Head title="Manajemen Pegawai" />
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Data Pegawai</h2>
                    <p className="text-muted-foreground">Kelola akun staf yang memiliki akses ke sistem.</p>
                </div>
                {canManageEmployees && (
                    <Button onClick={openCreateDialog} size="lg">
                        <Plus className="mr-2 h-4 w-4" /> Tambah Pegawai
                    </Button>
                )}
            </div>
            <div className="mt-8">
                <DataTable columns={columns} data={employees.data} pagination={employees} searchKey="name" />
            </div>
            
            {canManageEmployees && (
                <>
                    <EmployeeForm isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} employee={editingEmployee} />
                    <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Akun Pegawai?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Akses login pegawai ini akan dicabut permanen. Data transaksi yang pernah dibuat oleh pegawai ini tetap aman.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                    {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </>
    );
}

EmployeesIndex.layout = (page: any) => <AdminLayout children={page} />;
export default EmployeesIndex;