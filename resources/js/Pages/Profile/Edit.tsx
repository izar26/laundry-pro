import { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { User, Lock, Trash2, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (window.location.hash === '#password') {
            setActiveTab('password');
        }
    }, []);

    const menuItems = [
        {
            id: 'profile',
            label: 'Biodata Diri',
            description: 'Foto profil & data pribadi',
            icon: User,
        },
        {
            id: 'password',
            label: 'Keamanan',
            description: 'Password & proteksi',
            icon: Lock,
        },
        {
            id: 'danger',
            label: 'Zona Bahaya',
            description: 'Hapus akun permanen',
            icon: Trash2,
            variant: 'destructive',
        },
    ];

    return (
        <>
            <Head title={`Pengaturan - ${activeTab === 'profile' ? 'Biodata' : 'Keamanan'}`} />

            <div className="mx-auto max-w-6xl space-y-8 pb-16">
                
                {/* Header Section with Gradient Text */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight">Pengaturan Akun</h2>
                        </div>
                        <p className="text-blue-100 max-w-xl text-lg font-medium opacity-90">
                            Kelola identitas, preferensi, dan keamanan akun Anda dalam satu tempat yang terintegrasi.
                        </p>
                    </div>
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute bottom-0 right-20 h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl"></div>
                </div>

                {/* Main Content Area - Unified Card Layout */}
                <div className="flex flex-col lg:flex-row overflow-hidden rounded-3xl border border-border/50 bg-card shadow-xl backdrop-blur-sm">
                    
                    {/* Sidebar Panel */}
                    <aside className="lg:w-80 border-r border-border/50 bg-muted/30 p-6 lg:p-8 space-y-2">
                        <div className="mb-6 px-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Menu Navigasi</h3>
                        </div>
                        <nav className="space-y-2">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={cn(
                                        "group flex items-center gap-4 rounded-2xl px-4 py-4 text-sm font-medium transition-all w-full text-left relative overflow-hidden",
                                        activeTab === item.id 
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                                            : "hover:bg-background hover:shadow-md text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {/* Icon Container */}
                                    <div className={cn(
                                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                                        activeTab === item.id ? "bg-white/20 text-white" : "bg-muted group-hover:bg-primary/10 group-hover:text-primary"
                                    )}>
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    
                                    <div className="flex-1 z-10">
                                        <span className="block text-base font-bold">{item.label}</span>
                                        <span className={cn("text-xs font-normal", activeTab === item.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                            {item.description}
                                        </span>
                                    </div>

                                    {activeTab === item.id && (
                                        <ChevronRight className="h-5 w-5 opacity-80 animate-in slide-in-from-left-2" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Content Panel */}
                    <div className="flex-1 bg-background/50 p-6 lg:p-12 min-h-[600px]">
                        {/* Tab Biodata */}
                        {activeTab === 'profile' && (
                            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-8 border-b pb-6">
                                    <h3 className="text-2xl font-bold text-foreground">Biodata Diri</h3>
                                    <p className="text-muted-foreground mt-1">
                                        Informasi ini akan ditampilkan di profil publik dan struk transaksi.
                                    </p>
                                </div>
                                <UpdateProfileInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                />
                            </div>
                        )}

                        {/* Tab Password */}
                        {activeTab === 'password' && (
                            <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-8 border-b pb-6">
                                    <h3 className="text-2xl font-bold text-foreground">Keamanan Akun</h3>
                                    <p className="text-muted-foreground mt-1">
                                        Perbarui password Anda secara berkala untuk menjaga keamanan akun.
                                    </p>
                                </div>
                                <UpdatePasswordForm />
                            </div>
                        )}

                        {/* Tab Hapus Akun */}
                        {activeTab === 'danger' && (
                            <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-8 border-b pb-6 border-destructive/20">
                                    <h3 className="text-2xl font-bold text-destructive">Zona Bahaya</h3>
                                    <p className="text-destructive/70 mt-1">
                                        Hati-hati! Tindakan di halaman ini bersifat permanen.
                                    </p>
                                </div>
                                <div className="rounded-2xl border-2 border-destructive/10 bg-destructive/5 p-6">
                                    <DeleteUserForm className="max-w-xl" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

Edit.layout = (page: any) => <AdminLayout children={page} />;
export default Edit;
