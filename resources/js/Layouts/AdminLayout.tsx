import { useState, useEffect } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/Components/ui/sheet';
import { Menu, User as UserIcon, LogOut, Settings, Lock } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { ModeToggle } from '@/Components/ModeToggle';
import { ThemeCustomizer } from '@/Components/ThemeCustomizer';
import { ThemeProvider } from '@/Components/ThemeProvider';
import { Toaster } from '@/Components/ui/sonner';
import { toast } from 'sonner';
import BackgroundParticles from '@/Components/BackgroundParticles';
import { AdminSidebar } from '@/Components/AdminSidebar';
import { motion } from 'framer-motion';
import { GlobalCommandPalette } from '@/Components/GlobalCommandPalette';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { auth, flash, errors } = usePage().props as any;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile
    const [isCollapsed, setIsCollapsed] = useState(false); // Desktop Collapsed

    const user = auth.user;

    // Load collapsed state from local storage
    useEffect(() => {
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState) {
            setIsCollapsed(savedState === 'true');
        }
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    // Global Flash Message Listener
    useEffect(() => {
        if (flash?.message) {
            toast.success(flash.message);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash, flash?.timestamp]);

    return (
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <div className="min-h-screen bg-background text-foreground flex">
                <Toaster position="top-right" />
                
                {/* Desktop Sidebar (New Component) */}
                <div className="hidden md:block">
                    <AdminSidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
                </div>

                {/* Main Content Wrapper - Animasi Margin */}
                <motion.main 
                    className="flex-1 flex flex-col min-h-screen transition-all duration-300 relative overflow-hidden"
                    initial={false}
                    animate={{ marginLeft: isCollapsed ? 80 : 288 }} // 80px vs 288px (w-72)
                >
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
                        <BackgroundParticles />
                    </div>

                    {/* Header */}
                    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        {/* Mobile Sidebar Trigger */}
                        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle navigation menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-72">
                                <AdminSidebar isCollapsed={false} toggleCollapse={() => setIsSidebarOpen(false)} />
                            </SheetContent>
                        </Sheet>
                        
                        <div className="w-full flex justify-between items-center">
                            <h1 className="text-lg font-semibold md:text-xl">Dashboard</h1>
                            <div className="flex items-center gap-2">
                                <GlobalCommandPalette />
                                <ThemeCustomizer />
                                <ModeToggle />
                                
                                {/* User Menu (Desktop & Mobile) */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-muted transition-colors">
                                            <Avatar className="h-10 w-10 border border-border shadow-sm">
                                                <AvatarImage src={user.avatar ? `/storage/${user.avatar}` : `https://ui-avatars.com/api/?name=${user.name}&background=random`} />
                                                <AvatarFallback>U</AvatarFallback>
                                            </Avatar>
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full ring-1 ring-background"></div>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                                <p className="text-[10px] uppercase font-bold text-primary mt-1 tracking-wider">
                                                    {user.roles && user.roles.length > 0 ? user.roles[0] : 'User'}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href={route('profile.edit')} className="w-full cursor-pointer gap-2">
                                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                                <span>Biodata Diri</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={route('profile.edit') + '#password'} className="w-full cursor-pointer gap-2">
                                                <Lock className="h-4 w-4 text-muted-foreground" />
                                                <span>Ganti Password</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        
                                        {(user.roles?.includes('admin') || user.roles?.includes('owner')) && (
                                            <DropdownMenuItem asChild>
                                                <Link href={route('settings.index')} className="w-full cursor-pointer gap-2">
                                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                                    <span>Pengaturan Aplikasi</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <Link href={route('logout')} method="post" as="button" className="w-full cursor-pointer gap-2">
                                                <LogOut className="h-4 w-4" />
                                                <span>Keluar</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 p-6 space-y-6">
                        {children}
                    </div>
                </motion.main>
            </div>
        </ThemeProvider>
    );
}