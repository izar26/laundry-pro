import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Loader2, Command } from 'lucide-react';
import { motion } from 'framer-motion';
import BackgroundParticles from '@/Components/BackgroundParticles';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="flex min-h-screen w-full overflow-hidden bg-background">
            <Head title="Daftar Pelanggan - Laundry Pro" />

            {/* Kiri: Visual & Branding */}
            <div className="hidden w-1/2 flex-col justify-between bg-zinc-900 p-12 text-white lg:flex relative overflow-hidden">
                {/* Background Image */}
                <motion.div 
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 z-0"
                >
                    <img
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop"
                        alt="Abstract Liquid"
                        className="h-full w-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </motion.div>
                
                <div className="relative z-10 flex items-center gap-3 text-xl font-bold tracking-tight">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl">
                        <Command className="h-6 w-6" />
                    </div>
                    Laundry Pro
                </div>

                <div className="relative z-10 max-w-lg">
                    <blockquote className="space-y-4">
                        <p className="text-2xl font-medium leading-relaxed font-serif italic opacity-90">
                            &ldquo;Bergabunglah dengan ribuan pelanggan cerdas yang telah beralih ke cara modern merawat pakaian.&rdquo;
                        </p>
                    </blockquote>
                </div>
            </div>

            {/* Kanan: Register Form */}
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
                            Buat Akun Baru
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Isi data diri Anda untuk memulai perjalanan bebas kusut.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold pl-1">Nama Lengkap</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="John Doe"
                                value={data.name}
                                autoComplete="name"
                                onChange={(e) => setData('name', e.target.value)}
                                className={errors.name ? 'border-destructive h-11' : 'h-11 bg-zinc-50/50 dark:bg-zinc-900/50'}
                                autoFocus
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold pl-1">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="nama@email.com"
                                value={data.email}
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                className={errors.email ? 'border-destructive h-11' : 'h-11 bg-zinc-50/50 dark:bg-zinc-900/50'}
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold pl-1">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={data.password}
                                autoComplete="new-password"
                                onChange={(e) => setData('password', e.target.value)}
                                className={errors.password ? 'border-destructive h-11' : 'h-11 bg-zinc-50/50 dark:bg-zinc-900/50'}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold pl-1">Konfirmasi Password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                placeholder="••••••••"
                                value={data.password_confirmation}
                                autoComplete="new-password"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className={errors.password_confirmation ? 'border-destructive h-11' : 'h-11 bg-zinc-50/50 dark:bg-zinc-900/50'}
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <Button className="w-full h-11 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]" disabled={processing} size="lg">
                            {processing && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Daftar Sekarang
                        </Button>
                    </form>

                    <div className="text-center text-sm text-muted-foreground pt-2">
                        Sudah punya akun?{' '}
                        <Link
                            href={route('login')}
                            className="font-medium text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-all"
                        >
                            Masuk disini
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}