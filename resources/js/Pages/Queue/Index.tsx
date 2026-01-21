import { useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, CheckCircle2, Clock } from 'lucide-react';

type Transaction = {
    id: number;
    invoice_code: string;
    customer: { name: string };
};

export default function QueueIndex({ processing, ready }: { processing: Transaction[], ready: Transaction[] }) {
    
    // Auto Refresh setiap 10 detik
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['processing', 'ready'] });
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    // Format nama agar privasi terjaga (Budi Santoso -> Budi S.)
    const formatName = (name: string) => {
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0]} ${parts[1][0]}.`;
        }
        return name;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col font-sans overflow-hidden">
            <Head title="Antrian Laundry" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-xl">
                        <Shirt className="h-10 w-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                            STATUS CUCIAN
                        </h1>
                        <p className="text-slate-400 text-lg">Update Real-time</p>
                    </div>
                </div>
                <div className="text-right">
                    <Clock className="h-8 w-8 text-slate-500 inline-block mr-2" />
                    <span className="text-3xl font-mono font-bold text-slate-300">
                        {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Content Split */}
            <div className="flex-1 grid grid-cols-2 gap-12">
                
                {/* Kolom Sedang Proses */}
                <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800/50 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                    <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-blue-400">
                        <LoaderIcon /> SEDANG DIPROSES
                    </h2>
                    
                    <div className="space-y-4 flex-1 overflow-y-auto scrollbar-hide pr-2">
                        <AnimatePresence mode="popLayout">
                            {processing.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="bg-slate-800 rounded-2xl p-6 flex justify-between items-center shadow-lg border border-slate-700/50"
                                >
                                    <div>
                                        <span className="text-2xl font-bold block">{formatName(item.customer.name)}</span>
                                        <span className="text-slate-500 font-mono text-lg">{item.invoice_code}</span>
                                    </div>
                                    <div className="h-4 w-4 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]"></div>
                                </motion.div>
                            ))}
                            {processing.length === 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-600 mt-20 text-xl">
                                    Tidak ada antrian cuci.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Kolom Siap Ambil */}
                <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800/50 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                    <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-emerald-400">
                        <CheckCircle2 className="h-8 w-8" /> SIAP DIAMBIL
                    </h2>

                    <div className="space-y-4 flex-1 overflow-y-auto scrollbar-hide pr-2">
                        <AnimatePresence mode="popLayout">
                            {ready.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    className="bg-emerald-900/20 rounded-2xl p-6 flex justify-between items-center shadow-lg border border-emerald-500/30"
                                >
                                    <div>
                                        <span className="text-3xl font-black block text-emerald-100">{formatName(item.customer.name)}</span>
                                        <span className="text-emerald-400/70 font-mono text-lg">{item.invoice_code}</span>
                                    </div>
                                    <div className="bg-emerald-500 text-slate-950 px-4 py-1 rounded-full font-bold text-sm">READY</div>
                                </motion.div>
                            ))}
                             {ready.length === 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-600 mt-20 text-xl">
                                    Belum ada cucian selesai.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>

            {/* Footer ticker */}
            <div className="mt-8 pt-4 border-t border-slate-800 text-center text-slate-500 text-sm">
                <p>Silakan tunjukkan struk saat pengambilan • Terima Kasih</p>
            </div>
        </div>
    );
}

// Custom Loader Icon
function LoaderIcon() {
    return (
        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );
}
