import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { router, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { User, Clock, CheckCircle2 } from 'lucide-react';

type Transaction = {
    id: number;
    invoice_code: string;
    customer: { 
        user: { name: string } 
    };
    total_amount: string;
    final_amount: string;
    payment_method: string;
    payment_status: string;
    status: string;
    created_at: string;
};

type Column = {
    id: string;
    title: string;
    items: Transaction[];
    color: string;
};

export default function KanbanBoard({ transactions }: { transactions: Transaction[] }) {
    const { auth } = usePage().props as any;
    const isDragDisabled = auth.user.roles?.includes('pelanggan') || auth.user.roles?.includes('owner');

    const [columns, setColumns] = useState<Record<string, Column>>({
        pending: { id: 'pending', title: 'Menunggu', items: [], color: 'bg-yellow-500' },
        new: { id: 'new', title: 'Baru Masuk', items: [], color: 'bg-slate-500' },
        process: { id: 'process', title: 'Sedang Proses', items: [], color: 'bg-blue-500' },
        ready: { id: 'ready', title: 'Siap Ambil', items: [], color: 'bg-orange-500' },
        done: { id: 'done', title: 'Selesai', items: [], color: 'bg-emerald-600' },
        cancelled: { id: 'cancelled', title: 'Dibatalkan', items: [], color: 'bg-red-500' },
    });

    // Inisialisasi data kolom
    useEffect(() => {
        const newCols = {
            pending: { id: 'pending', title: 'Menunggu', items: [], color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200' },
            new: { id: 'new', title: 'Baru Masuk', items: [], color: 'bg-slate-100 dark:bg-slate-900 border-slate-200' },
            process: { id: 'process', title: 'Sedang Proses', items: [], color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' },
            ready: { id: 'ready', title: 'Siap Ambil', items: [], color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200' },
            done: { id: 'done', title: 'Selesai', items: [], color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200' },
            cancelled: { id: 'cancelled', title: 'Dibatalkan', items: [], color: 'bg-red-50 dark:bg-red-900/20 border-red-200' },
        };

        transactions.forEach(trx => {
            if (newCols[trx.status as keyof typeof newCols]) {
                newCols[trx.status as keyof typeof newCols].items.push(trx as never);
            }
        });

        setColumns(newCols);
    }, [transactions]);

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const { source, destination } = result;

        if (source.droppableId !== destination.droppableId) {
            const sourceCol = columns[source.droppableId];
            const destCol = columns[destination.droppableId];
            const sourceItems = [...sourceCol.items];
            const destItems = [...destCol.items];
            const [removed] = sourceItems.splice(source.index, 1);
            destItems.splice(destination.index, 0, { ...removed, status: destination.droppableId }); // Optimistic update

            setColumns({
                ...columns,
                [source.droppableId]: { ...sourceCol, items: sourceItems },
                [destination.droppableId]: { ...destCol, items: destItems },
            });

            // Kirim request ke server
            router.patch(route('transactions.status', removed.id), {
                status: destination.droppableId
            }, {
                onSuccess: () => toast.success(`Status diubah: ${destCol.title}`),
                onError: () => {
                    toast.error("Gagal update status.");
                    router.reload(); // Revert jika gagal
                },
                preserveScroll: true,
                preserveState: true, // Jangan reload full page
            });
        }
    };

    const formatRupiah = (val: string) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(val));

    return (
        <div className="h-full overflow-x-auto pb-4">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 min-w-[1000px]">
                    {Object.values(columns).map((column) => (
                        <div key={column.id} className="w-1/4 min-w-[250px] flex flex-col gap-2">
                            <div className={cn("p-3 rounded-lg border font-bold text-sm flex justify-between items-center shadow-sm", column.color)}>
                                {column.title}
                                <Badge variant="secondary" className="bg-background/50">{column.items.length}</Badge>
                            </div>
                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={cn(
                                            "flex-1 rounded-lg p-2 transition-colors min-h-[500px]",
                                            snapshot.isDraggingOver ? "bg-accent/50" : "bg-transparent"
                                        )}
                                    >
                                        {column.items.map((item, index) => (
                                            <Draggable key={item.id} draggableId={item.id.toString()} index={index} isDragDisabled={isDragDisabled}>
                                                {(provided, snapshot) => (
                                                    <Card
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={cn(
                                                            "mb-3 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing",
                                                            snapshot.isDragging ? "shadow-xl ring-2 ring-primary rotate-2" : ""
                                                        )}
                                                    >
                                                        <CardContent className="p-3 space-y-2">
                                                            <div className="flex justify-between items-start">
                                                                <span className="font-mono text-xs font-bold">{item.invoice_code}</span>
                                                                <Badge variant={item.payment_status === 'paid' ? 'default' : 'destructive'} className="text-[10px] py-0 h-5">
                                                                    {item.payment_status === 'paid' ? 'Lunas' : 'Belum'}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                                <User className="h-3 w-3 text-muted-foreground" />
                                                                {item.customer.user?.name || 'Umum'}
                                                            </div>
                                                            <div className="flex justify-between items-end pt-2 border-t">
                                                                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {format(new Date(item.created_at), "dd MMM", { locale: idLocale })}
                                                                </div>
                                                                <div className="font-bold text-sm">
                                                                    {formatRupiah(item.final_amount)}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
