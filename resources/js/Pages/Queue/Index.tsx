import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, CheckCircle2, Clock, Inbox, PlayCircle, Check, XCircle } from 'lucide-react';

type Transaction = {
    id: number;
    invoice_code: string;
    status: string;
    time: string;
    customer?: { name: string } | null;
};

type QueueProps = {
    queue: {
        pending: Transaction[];
        new: Transaction[];
        process: Transaction[];
        ready: Transaction[];
        done: Transaction[];
        cancelled: Transaction[];
    }
};

export default function QueueIndex({ queue }: QueueProps) {
    
    // Auto Refresh setiap 10 detik
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['queue'] });
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    // Format nama agar privasi terjaga (Budi Santoso -> Budi S.)
    const formatName = (name?: string | null) => {
        if (!name) return 'Pelanggan Biasa';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0]} ${parts[1][0]}.`;
        }
        return name;
    };

    const newOrders = [...queue.pending, ...queue.new];
    const completedOrders = [...queue.done, ...queue.cancelled];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-8 flex flex-col font-sans overflow-hidden">
            <Head title="Live Queue Board" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl border border-blue-200">
                        <Shirt className="h-10 w-10 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">
                            LIVE QUEUE BOARD
                        </h1>
                        <p className="text-slate-500 font-medium tracking-wide">Pantau status layanan laundry Anda di sini</p>
                    </div>
                </div>
                <div className="text-right flex items-center justify-center bg-slate-100 rounded-xl px-6 py-4 border border-slate-200">
                    <Clock className="h-6 w-6 text-slate-500 mr-3" />
                    <span className="text-3xl font-mono font-bold text-slate-800 tracking-tight">
                        {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Grid 4 Kolom Status */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Kolom BARU */}
                <QueueColumn 
                    title="Pesanan Baru" 
                    icon={<Inbox className="h-6 w-6 text-slate-500" />} 
                    colorClass="border-slate-300 bg-slate-100 text-slate-800"
                    headerBg="bg-slate-200 text-slate-700"
                    items={newOrders}
                    formatName={formatName}
                />

                {/* Kolom PROSES */}
                <QueueColumn 
                    title="Sedang Diproses" 
                    icon={<PlayCircle className="h-6 w-6 text-blue-500" />} 
                    colorClass="border-blue-200 bg-blue-50/50"
                    headerBg="bg-blue-100 text-blue-800"
                    items={queue.process}
                    formatName={formatName}
                    pulseBadge
                />

                {/* Kolom READY */}
                <QueueColumn 
                    title="Siap Diambil" 
                    icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />} 
                    colorClass="border-emerald-200 bg-emerald-50/50 shadow-sm"
                    headerBg="bg-emerald-100 text-emerald-800"
                    items={queue.ready}
                    formatName={formatName}
                    highlightCard
                />

                {/* Kolom SELESAI */}
                <QueueColumn 
                    title="Selesai / Batal" 
                    icon={<Check className="h-6 w-6 text-slate-500" />} 
                    colorClass="border-slate-200 bg-white"
                    headerBg="bg-gray-100 text-gray-700"
                    items={completedOrders}
                    formatName={formatName}
                    opacityCard
                />

            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 text-center text-slate-500 font-medium">
                <p>Terima Kasih Atas Kepercayaan Anda! • Siapkan struk saat pengambilan.</p>
            </div>
        </div>
    );
}

// Sub Komponen Kolom Kanban
function QueueColumn({ 
    title, icon, items, formatName, colorClass, headerBg, highlightCard, opacityCard, pulseBadge 
}: { 
    title: string, icon: any, items: Transaction[], formatName: any, colorClass: string, headerBg: string, highlightCard?: boolean, opacityCard?: boolean, pulseBadge?: boolean
}) {
    return (
        <div className={`rounded-3xl border flex flex-col overflow-hidden shadow-sm ${colorClass}`}>
            <div className={`px-5 py-4 ${headerBg} flex items-center justify-between border-b border-black/5`}>
                <h2 className="text-lg font-bold flex items-center gap-2">
                    {icon} {title}
                </h2>
                <span className="font-bold bg-white/50 px-3 py-1 rounded-full text-sm">
                    {items.length}
                </span>
            </div>
            
            <div className="p-4 space-y-4 flex-1 overflow-y-auto scrollbar-hide max-h-[65vh]">
                <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`p-5 rounded-2xl border flex flex-col gap-2 
                                ${highlightCard ? 'bg-white border-emerald-300 shadow-md ring-1 ring-emerald-100' : 'bg-white border-slate-200 shadow-sm'} 
                                ${opacityCard ? 'opacity-70 grayscale-[20%]' : ''}`
                            }
                        >
                            <div className="flex justify-between items-start">
                                <span className={`text-xl font-bold tracking-tight ${highlightCard ? 'text-emerald-900' : 'text-slate-800'}`}>
                                    {formatName(item.customer?.name)}
                                </span>
                                {pulseBadge && (
                                    <span className="flex h-3 w-3 relative mt-1.5 align-top">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                    </span>
                                )}
                                {item.status === 'cancelled' && (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                )}
                            </div>
                            
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-mono text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
                                    {item.invoice_code}
                                </span>
                                <span className="text-slate-400 font-medium tracking-tight">
                                    {item.time}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                    {items.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-400 py-10 font-medium">
                            Kosong
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
