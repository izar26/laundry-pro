import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import InputError from '@/Components/InputError';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Loader2, Command } from 'lucide-react';
import { motion } from 'framer-motion';
import BackgroundParticles from '@/Components/BackgroundParticles';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { app_settings } = usePage().props as any;
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="flex min-h-screen w-full overflow-hidden bg-background">
            <Head title={`Masuk - ${app_settings.app_name}`} />

            {/* Kiri: Artistic Visual & Branding */}
            <div className="hidden w-1/2 flex-col justify-between bg-zinc-900 p-12 text-white lg:flex relative overflow-hidden">
                {/* Background Image - Abstract Modern */}
                <motion.div 
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 z-0"
                >
                    <img
                        src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop"
                        alt="Modern Background"
                        className="h-full w-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </motion.div>
                
                <div className="relative z-10 flex items-center gap-3 text-xl font-bold tracking-tight">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl">
                        <Command className="h-6 w-6" />
                    </div>
                    {app_settings.app_name || 'Laundry Pro'}
                </div>

                <div className="relative z-10 max-w-lg">
                    <blockquote className="space-y-4">
                        <p className="text-2xl font-medium leading-relaxed font-serif italic opacity-90">
                            &ldquo;Kesederhanaan adalah kecanggihan tertinggi. Kami hadirkan teknologi untuk menyederhanakan bisnis Anda.&rdquo;
                        </p>
                        <footer className="text-sm text-zinc-400 flex items-center gap-2">
                            <span className="h-px w-8 bg-zinc-600"></span>
                            {app_settings.app_address || 'Est. 2024'}
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* Kanan: Login Form */}
            <div className="flex w-full items-center justify-center p-8 lg:w-1/2 relative bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-3xl">
                <BackgroundParticles />
                
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px] relative z-10 bg-white/80 dark:bg-zinc-950/80 p-8 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 backdrop-blur-xl"
                >
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-100">
                            Selamat Datang
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Masukkan detail akun Anda untuk melanjutkan akses.
                        </p>
                    </div>

                    {status && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600 border border-emerald-500/20 text-center"
                        >
                            {status}
                        </motion.div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold pl-1">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={data.email}
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                className={errors.email ? 'border-destructive focus-visible:ring-destructive h-11' : 'h-11 bg-zinc-50/50 dark:bg-zinc-900/50'}
                                autoFocus
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold pl-1">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={data.password}
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                                className={errors.password ? 'border-destructive focus-visible:ring-destructive h-11' : 'h-11 bg-zinc-50/50 dark:bg-zinc-900/50'}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="remember"
                                checked={data.remember}
                                onCheckedChange={(checked) =>
                                    setData('remember', checked as boolean)
                                }
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <Label
                                htmlFor="remember"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-600 dark:text-zinc-400"
                            >
                                Ingat saya di perangkat ini
                            </Label>
                        </div>

                        <Button className="w-full h-11 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]" disabled={processing} size="lg">
                            {processing && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Masuk Sekarang
                        </Button>

                        <div className="mt-4 text-center text-sm">
                            <span className="text-muted-foreground">Belum punya akun? </span>
                            <Link
                                href={route('register')}
                                className="font-medium text-primary hover:text-primary/80 hover:underline"
                            >
                                Daftar sebagai pelanggan
                            </Link>
                        </div>
                    </form>
                </motion.div>
                
                <div className="absolute bottom-6 text-center text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} {app_settings.app_name}. All rights reserved.
                </div>
            </div>
        </div>
    );
}