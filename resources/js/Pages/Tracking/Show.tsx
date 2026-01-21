import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Check, Clock, Shirt, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

type Step = {
    status: string;
    label: string;
    desc: string;
};

type Transaction = {
    invoice_code: string;
    status: string;
    total_amount: string;
    final_amount: string;
    created_at: string;
    details: any[];
};

export default function TrackingShow({ transaction, steps, currentStepIndex }: { transaction: Transaction, steps: Step[], currentStepIndex: number }) {
    
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
            <Head title={`Lacak ${transaction.invoice_code}`} />
            
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl shadow-sm mb-4">
                    <Shirt className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Laundry Pro</h1>
                <p className="text-slate-500 text-sm">Layanan Laundry Premium</p>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-md space-y-6"
            >
                {/* Status Card */}
                <Card className="border-none shadow-lg overflow-hidden">
                    <div className={cn("h-2 w-full", 
                        transaction.status === 'done' ? "bg-emerald-500" :
                        transaction.status === 'ready' ? "bg-orange-500" : 
                        "bg-blue-500"
                    )} />
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-lg font-medium text-slate-500">Status Pesanan</CardTitle>
                        <div className="text-3xl font-bold mt-1">
                            {steps[currentStepIndex]?.label}
                        </div>
                        <Badge variant="outline" className="mx-auto mt-2 font-mono">
                            {transaction.invoice_code}
                        </Badge>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="relative pl-4 border-l-2 border-slate-100 ml-4 space-y-8 py-2">
                            {steps.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isCurrent = index === currentStepIndex;

                                return (
                                    <div key={step.status} className="relative">
                                        <div className={cn(
                                            "absolute -left-[21px] top-0 h-4 w-4 rounded-full border-2 flex items-center justify-center bg-white transition-colors duration-500",
                                            isCompleted ? "border-primary bg-primary text-white" : "border-slate-300"
                                        )}>
                                            {isCompleted && <Check className="h-2.5 w-2.5" />}
                                        </div>
                                        <div className={cn("transition-opacity duration-500", isCompleted ? "opacity-100" : "opacity-40")}>
                                            <h3 className={cn("text-sm font-semibold", isCurrent && "text-primary")}>{step.label}</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Detail Order */}
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="h-4 w-4" /> Rincian Cucian
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {transaction.details.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                                <div>
                                    <div className="font-medium">{item.service_name}</div>
                                    <div className="text-xs text-slate-500">{parseFloat(item.qty)} x</div>
                                </div>
                            </div>
                        ))}
                        <div className="pt-2 mt-2 border-t flex justify-between items-center font-bold">
                            <span>Total</span>
                            <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(transaction.final_amount))}</span>
                        </div>
                        <div className="text-xs text-center text-slate-400 pt-4">
                            Diterima pada {format(new Date(transaction.created_at), "dd MMMM yyyy, HH:mm", { locale: idLocale })}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
