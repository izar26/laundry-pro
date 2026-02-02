import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";
import { 
    LayoutDashboard, Users, ShoppingBag, Shirt, TrendingUp, 
    Settings, Store, FileText, ChevronLeft, Plus, LogOut, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';

interface AdminSidebarProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

export function AdminSidebar({ isCollapsed, toggleCollapse }: AdminSidebarProps) {
    const { app_settings, auth } = usePage().props as any;
    const user = auth.user;
    const userRoles = user.roles || [];
    const isAdminOrOwner = userRoles.includes('admin') || userRoles.includes('owner');
    const isPegawai = userRoles.includes('pegawai');
    const isPelanggan = userRoles.includes('pelanggan');
    const currentRoute = route().current();

    const baseItems = [
        { name: 'Dashboard', url: route('dashboard'), icon: LayoutDashboard },
        { name: 'Transaksi', url: route('transactions.index'), icon: ShoppingBag },
    ];

    // Menu yang hanya untuk manajemen (Admin, Owner, Pegawai)
    const managementItems = [
         { name: 'Pelanggan', url: route('customers.index'), icon: Users },
    ];

    const catalogItems = [
        { name: 'Layanan', url: route('services.index'), icon: Shirt },
        { name: 'Diskon', url: route('promotions.index'), icon: TrendingUp },
    ];

    const adminItems = [
        { name: 'Laporan', url: route('reports.index'), icon: FileText },
        { name: 'Pegawai', url: route('employees.index'), icon: Users },
        { name: 'Info Laundry', url: route('settings.index'), icon: Store },
    ];

    const menuItems = [
        ...baseItems,
        // Tampilkan menu Pelanggan hanya untuk Admin/Owner/Pegawai
        ...((isAdminOrOwner || isPegawai) ? managementItems : []),
        ...catalogItems, // Layanan & Diskon tampil untuk semua (termasuk Pelanggan)
        ...(isAdminOrOwner ? adminItems : []),
    ];

    const logoUrl = app_settings.app_logo ? `/storage/${app_settings.app_logo}` : null;

    return (
        <TooltipProvider delayDuration={0}>
            <motion.aside 
                className={cn(
                    "fixed left-0 top-0 z-40 h-screen border-r border-border/50 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col backdrop-blur-xl bg-card/90",
                    isCollapsed ? "w-[80px]" : "w-72"
                )}
                initial={false}
                animate={{ width: isCollapsed ? 80 : 288 }}
            >
                {/* Header Logo */}
                <div className="h-20 flex items-center justify-center px-4 relative mb-2">
                    <div className={cn("flex items-center gap-3 overflow-hidden w-full transition-all", isCollapsed ? "justify-center" : "")}>
                        {logoUrl ? (
                            <motion.img 
                                layoutId="logo"
                                src={logoUrl} 
                                alt="Logo" 
                                className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-primary/20" 
                            />
                        ) : (
                            <motion.div 
                                layoutId="logo"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold shadow-lg shadow-primary/30"
                            >
                                <Shirt className="h-6 w-6" />
                            </motion.div>
                        )}
                        
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="overflow-hidden"
                                >
                                    <h1 className="font-bold text-xl leading-none tracking-tight">{app_settings.app_name || 'Laundry Pro'}</h1>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">Management</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Toggle Button */}
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-50">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 rounded-full border shadow-md hover:scale-110 transition-transform"
                            onClick={toggleCollapse}
                        >
                            <ChevronLeft className={cn("h-3 w-3 transition-transform duration-500", isCollapsed && "rotate-180")} />
                        </Button>
                    </div>
                </div>

                {/* Quick Action - Hide for Owner */}
                {!userRoles.includes('owner') && (
                    <div className="px-3 mb-4">
                        {isCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" className="w-full h-12 rounded-xl shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary/80 hover:brightness-110 transition-all" asChild>
                                        <Link href={route('transactions.create')}>
                                            <Plus className="h-6 w-6" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-bold">Transaksi Baru</TooltipContent>
                            </Tooltip>
                        ) : (
                            <Button className="w-full h-12 rounded-xl shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary/80 hover:brightness-110 transition-all justify-start gap-3 font-bold text-md" asChild>
                                <Link href={route('transactions.create')}>
                                    <div className="bg-white/20 p-1 rounded-md">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                    Transaksi Baru
                                </Link>
                            </Button>
                        )}
                    </div>
                )}

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 scrollbar-hide">
                    {menuItems.map((item) => {
                        const isActive = currentRoute === undefined 
                            ? false 
                            : route().current(item.url) || (item.url !== '#' && window.location.href === item.url) || (item.url !== '#' && window.location.href.includes(item.url.split('?')[0]));

                        return (
                            <Tooltip key={item.name}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.url}
                                        className={cn(
                                            "relative flex items-center rounded-xl py-3 text-sm font-medium transition-all group overflow-hidden outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
                                            isCollapsed ? "justify-center px-2" : "px-3 gap-3",
                                            isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {/* Active Background Slide Effect */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-nav"
                                                className="absolute inset-0 bg-primary rounded-xl z-0 shadow-lg shadow-primary/30"
                                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                            />
                                        )}
                                        
                                        {/* Hover Effect */}
                                        {!isActive && (
                                            <div className="absolute inset-0 bg-accent/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        )}

                                        <item.icon className={cn("h-5 w-5 shrink-0 z-10 relative transition-transform duration-300 group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                                        
                                        <AnimatePresence>
                                            {!isCollapsed && (
                                                <motion.span
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, width: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                    className="whitespace-nowrap overflow-hidden z-10 relative font-medium"
                                                >
                                                    {item.name}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>

                                        {isActive && !isCollapsed && (
                                            <motion.div 
                                                layoutId="active-indicator"
                                                className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white z-10" 
                                            />
                                        )}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent side="right" className="font-semibold">{item.name}</TooltipContent>}
                            </Tooltip>
                        );
                    })}
                </div>
            </motion.aside>
        </TooltipProvider>
    );
}