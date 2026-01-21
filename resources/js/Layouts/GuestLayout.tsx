import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import BackgroundParticles from '@/Components/BackgroundParticles';
import { Command } from 'lucide-react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen w-full overflow-hidden bg-background">
            {/* Kiri: Visual & Branding */}
            <div className="hidden w-1/2 flex-col justify-between bg-zinc-900 p-12 text-white lg:flex relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1614850523060-8da1d56e37ad?q=80&w=2070&auto=format&fit=crop"
                        alt="Abstract Background"
                        className="h-full w-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>
                
                <div className="relative z-10 flex items-center gap-3 text-xl font-bold tracking-tight">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl">
                        <Command className="h-6 w-6" />
                    </div>
                    Laundry Pro
                </div>

                <div className="relative z-10 max-w-lg">
                    <blockquote className="space-y-4">
                        <p className="text-2xl font-medium leading-relaxed font-serif italic opacity-90">
                            &ldquo;Teknologi yang memudahkan hidup Anda.&rdquo;
                        </p>
                    </blockquote>
                </div>
            </div>

            {/* Kanan: Content Form */}
            <div className="flex w-full items-center justify-center p-8 lg:w-1/2 relative bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-3xl">
                <BackgroundParticles />
                
                <div className="mx-auto w-full max-w-[400px] relative z-10 bg-white/80 dark:bg-zinc-950/80 p-8 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 backdrop-blur-xl">
                    <div className="flex justify-center mb-6 lg:hidden">
                        <Link href="/">
                            <ApplicationLogo className="h-16 w-16 fill-current text-primary" />
                        </Link>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
