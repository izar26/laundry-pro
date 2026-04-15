import { useState, useEffect, useMemo, useRef } from 'react';
import 'regenerator-runtime/runtime';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { SpotlightCard } from "@/Components/ui/spotlight-card";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/Components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { 
    Check, 
    ChevronsUpDown, 
    Search, 
    ShoppingCart, 
    Plus, 
    Minus, 
    Trash, 
    CreditCard, 
    Banknote,
    Loader2,
    ArrowLeft,
    Keyboard,
    Mic,
    MicOff,
    Tag,
    Info,
    Sparkles,
    X,
    TicketPercent
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import confetti from 'canvas-confetti';
import Fuse from 'fuse.js';

// Tipe Data
type Customer = { id: number; name: string; phone: string };
type Service = { id: number; name: string; price: string; unit: string; description: string };
type Promotion = { 
    id: number; 
    name: string;
    code: string | null; 
    type: string; 
    value: string; 
    min_weight?: string | null; 
    min_amount?: string | null;
    service_id?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    is_active?: boolean;
    description?: string | null;
};

type CartItem = {
    serviceId: number;
    name: string;
    price: number;
    unit: string;
    qty: number;
};

type AppliedPromoInfo = {
    promo: Promotion;
    amount: number;
    label: string; // e.g. "10%" or "Rp5.000"
    isCode: boolean; // apakah dari kode voucher
};

type IneligiblePromoInfo = {
    promo: Promotion;
    reason: string;
    progress?: number; // 0-100, progress menuju eligible
};

type DiscountInfo = {
    totalDiscount: number;
    applied: AppliedPromoInfo[];
    ineligible: IneligiblePromoInfo[];
};

declare global {
    interface Window {
        snap: any;
    }
}

function RollingNumber({ value }: { value: number }) {
    return (
        <motion.span
            key={value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
        >
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)}
        </motion.span>
    );
}

function CartItemRow({ item, updateQty, removeItem }: { item: CartItem, updateQty: (id: number, delta: number) => void, removeItem: (id: number) => void }) {
    const x = useMotionValue(0);
    const opacity = useTransform(x, [-100, 0], [0, 1]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100, height: 0 }}
            style={{ x, opacity }}
            drag="x"
            dragConstraints={{ left: -100, right: 0 }}
            onDragEnd={(e, { offset }) => {
                if (offset.x < -80) {
                    removeItem(item.serviceId);
                }
            }}
            className="relative touch-none"
        >
            <motion.div 
                style={{ opacity: useTransform(x, [-50, 0], [1, 0]) }}
                className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4 text-red-500 font-bold text-xs"
            >
                LEPAS UNTUK HAPUS <Trash className="ml-1 h-4 w-4" />
            </motion.div>

            <div className="flex items-center justify-between bg-background p-3 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 relative z-10">
                <div className="flex-1 mr-2">
                    <div className="font-medium text-sm line-clamp-1" title={item.name}>{item.name}</div>
                    <div className="text-xs text-muted-foreground">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)} / {item.unit}</div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-muted rounded-md h-8 shadow-inner">
                        <button onClick={() => updateQty(item.serviceId, -0.5)} className="w-8 h-full flex items-center justify-center hover:bg-background rounded-l-md transition-colors text-muted-foreground hover:text-foreground active:scale-90"><Minus className="h-3 w-3" /></button>
                        <motion.span 
                            key={item.qty}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="text-sm font-mono w-8 text-center"
                        >
                            {item.qty}
                        </motion.span>
                        <button onClick={() => updateQty(item.serviceId, 0.5)} className="w-8 h-full flex items-center justify-center hover:bg-background rounded-r-md transition-colors text-muted-foreground hover:text-foreground active:scale-90"><Plus className="h-3 w-3" /></button>
                    </div>
                </div>
                <div className="text-right min-w-[70px] ml-2">
                    <div className="font-semibold text-sm">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price * item.qty)}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function TransactionCreate({ customers, services, promotions }: { 
    customers: Customer[], 
    services: Service[], 
    promotions: Promotion[] 
}) {
    const { midtrans_client_key, midtrans_is_production, auth } = usePage().props as any;
    const user = auth.user;
    const isCustomerRole = user.roles?.includes('pelanggan');
    
    // UI State
    const [serviceSearch, setServiceSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'kiloan' | 'satuan'>('all');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Fuse.js Instances
    const serviceFuse = useMemo(() => new Fuse(services, {
        keys: ['name', 'description'],
        threshold: 0.4,
        includeScore: true
    }), [services]);

    const customerFuse = useMemo(() => new Fuse(customers, {
        keys: ['name', 'phone'],
        threshold: 0.4,
        includeScore: true
    }), [customers]);

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    
    // Auto-select customer for 'pelanggan' role
    const initialCustomer = useMemo(() => {
        if (isCustomerRole) {
            // customers prop sekarang berisi array object dengan property user_id
            // Kita cocokkan user_id dari list dengan id user yang login
            const found = customers.find(c => (c as any).user_id === user.id);
            return found || null;
        }
        return null;
    }, [isCustomerRole, customers, user]);

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer);
    
    // Update selectedCustomer if initialCustomer changes (e.g. data loaded)
    useEffect(() => {
        if (initialCustomer) setSelectedCustomer(initialCustomer);
    }, [initialCustomer]);

    const [openCombobox, setOpenCombobox] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'midtrans'>('cash');
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Hotkeys
    useHotkeys('ctrl+f', (e) => { e.preventDefault(); searchInputRef.current?.focus(); });
    useHotkeys('ctrl+enter', () => { if(cart.length > 0 && selectedCustomer) handleCheckout(); });

    // Load Midtrans
    useEffect(() => {
        if (!midtrans_client_key) return;
        const script = document.createElement("script");
        const baseUrl = midtrans_is_production 
            ? "https://app.midtrans.com/snap/snap.js" 
            : "https://app.sandbox.midtrans.com/snap/snap.js";
        script.src = baseUrl;
        script.setAttribute("data-client-key", midtrans_client_key);
        script.async = true;
        document.body.appendChild(script);
        return () => { if (document.body.contains(script)) document.body.removeChild(script); };
    }, [midtrans_client_key, midtrans_is_production]);

    const filteredServices = services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(serviceSearch.toLowerCase());
        const matchesCategory = categoryFilter === 'all' ? true : categoryFilter === 'kiloan' ? (service.unit === 'kg' || service.unit === 'meter') : (service.unit === 'pcs' || service.unit === 'set');
        return matchesSearch && matchesCategory;
    });

    const addToCart = (service: Service) => {
        setCart(prev => {
            const existing = prev.find(item => item.serviceId === service.id);
            if (existing) return prev.map(item => item.serviceId === service.id ? { ...item, qty: item.qty + 1 } : item);
            return [...prev, { serviceId: service.id, name: service.name, price: parseFloat(service.price), unit: service.unit, qty: 1 }];
        });
        toast.success(`${service.name} ditambahkan.`);
    };

    const updateQty = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.serviceId === id) {
                let step = (item.unit === 'pcs' || item.unit === 'set') ? 1 : 0.5;
                return { ...item, qty: Math.max(step, item.qty + (delta > 0 ? step : -step)) };
            }
            return item;
        }));
    };

    const removeItem = (id: number) => {
        setCart(prev => prev.filter(item => item.serviceId !== id));
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const totalWeightKg = cart.filter(item => item.unit === 'kg').reduce((acc, item) => acc + item.qty, 0);

    // Helper format rupiah (dipindah ke atas agar bisa dipakai di discountInfo)
    const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    const discountInfo: DiscountInfo = useMemo(() => {
        const applied: AppliedPromoInfo[] = [];
        const ineligible: IneligiblePromoInfo[] = [];
        let totalDiscount = 0;
        const processedIds = new Set<number>(); // Anti double-apply

        const processPromo = (p: Promotion, isCode: boolean) => {
            if (processedIds.has(p.id)) return; // Sudah diproses (anti double)

            // Cek min_amount
            if (p.min_amount && subtotal < parseFloat(p.min_amount)) {
                const needed = parseFloat(p.min_amount);
                const progress = Math.min(100, Math.round((subtotal / needed) * 100));
                ineligible.push({ 
                    promo: p, 
                    reason: `Min. transaksi ${formatRupiah(needed)} (kurang ${formatRupiah(needed - subtotal)})`,
                    progress 
                });
                return;
            }

            // Cek min_weight
            if (p.min_weight && totalWeightKg < parseFloat(p.min_weight)) {
                const needed = parseFloat(p.min_weight);
                const progress = Math.min(100, Math.round((totalWeightKg / needed) * 100));
                ineligible.push({ 
                    promo: p, 
                    reason: `Min. berat ${needed}kg (kurang ${(needed - totalWeightKg).toFixed(1)}kg)`,
                    progress 
                });
                return;
            }

            // Cek service_id — apakah layanan target ada di cart
            let baseVal = subtotal;
            if (p.service_id) {
                const targetItems = cart.filter(i => i.serviceId === p.service_id);
                if (targetItems.length === 0) {
                    // Cari nama layanan dari services prop
                    const svc = services.find(s => s.id === p.service_id);
                    ineligible.push({ 
                        promo: p, 
                        reason: `Khusus layanan "${svc?.name || 'tertentu'}" — belum ada di keranjang` 
                    });
                    return;
                }
                baseVal = targetItems.reduce((acc, i) => acc + (i.price * i.qty), 0);
            }

            // Hitung diskon
            const amount = p.type === 'percentage' 
                ? baseVal * (parseFloat(p.value) / 100) 
                : Math.min(parseFloat(p.value), baseVal);

            if (amount > 0) {
                const label = p.type === 'percentage' 
                    ? `${parseFloat(p.value)}%` 
                    : formatRupiah(parseFloat(p.value));
                applied.push({ promo: p, amount, label, isCode });
                totalDiscount += amount;
                processedIds.add(p.id);
            }
        };

        // 1. Apply promo kode (manual) dulu
        if (appliedPromo) processPromo(appliedPromo, true);
        
        // 2. Apply auto promos (tanpa kode)
        promotions.filter(p => !p.code).forEach(p => processPromo(p, false));
        
        totalDiscount = Math.min(totalDiscount, subtotal);
        return { totalDiscount, applied, ineligible };
    }, [cart, appliedPromo, subtotal, totalWeightKg, promotions, services]);

    const discount = discountInfo.totalDiscount;
    const total = subtotal - discount;

    // Auto re-validate promo kode saat cart berubah
    useEffect(() => {
        if (!appliedPromo) return;
        
        // Cek apakah promo kode masih eligible
        const p = appliedPromo;
        let stillEligible = true;
        let reason = '';

        if (p.min_amount && subtotal < parseFloat(p.min_amount)) {
            stillEligible = false;
            reason = `Subtotal di bawah minimum ${formatRupiah(parseFloat(p.min_amount))}`;
        } else if (p.min_weight && totalWeightKg < parseFloat(p.min_weight)) {
            stillEligible = false;
            reason = `Berat di bawah minimum ${p.min_weight}kg`;
        } else if (p.service_id) {
            const hasTarget = cart.some(i => i.serviceId === p.service_id);
            if (!hasTarget) {
                stillEligible = false;
                reason = 'Layanan terkait dihapus dari keranjang';
            }
        }

        if (!stillEligible && cart.length > 0) {
            toast.warning(`Promo "${p.name}" dicabut: ${reason}`, { duration: 4000 });
            setAppliedPromo(null);
            setPromoCode('');
        }
    }, [cart, subtotal, totalWeightKg]);

    const applyPromoCode = () => {
        if (!promoCode) {
            setAppliedPromo(null);
            return;
        }
        const code = promoCode.trim().toUpperCase();
        const promo = promotions.find(p => p.code === code);
        
        if (!promo) {
            toast.error('Kode promo tidak ditemukan!', { description: `"${code}" bukan kode promo yang valid.` });
            setAppliedPromo(null);
            return;
        }

        // Validasi kelengkapan
        const errors: string[] = [];

        if (promo.min_amount && subtotal < parseFloat(promo.min_amount)) {
            errors.push(`Min. transaksi ${formatRupiah(parseFloat(promo.min_amount))} (saat ini ${formatRupiah(subtotal)})`);
        }
        if (promo.min_weight && totalWeightKg < parseFloat(promo.min_weight)) {
            errors.push(`Min. berat ${promo.min_weight}kg (saat ini ${totalWeightKg}kg)`);
        }
        if (promo.service_id) {
            const hasTarget = cart.some(i => i.serviceId === promo.service_id);
            if (!hasTarget) {
                const svc = services.find(s => s.id === promo.service_id);
                errors.push(`Khusus layanan "${svc?.name || 'tertentu'}" — tambahkan ke keranjang dulu`);
            }
        }
        if (cart.length === 0) {
            errors.push('Keranjang masih kosong');
        }

        if (errors.length > 0) {
            toast.error('Promo belum bisa dipakai', { 
                description: errors.join('. '),
                duration: 5000 
            });
            setAppliedPromo(null);
            return;
        }

        // Hitung preview diskon
        let baseVal = subtotal;
        if (promo.service_id) {
            baseVal = cart.filter(i => i.serviceId === promo.service_id).reduce((a, i) => a + i.price * i.qty, 0);
        }
        const previewDiscount = promo.type === 'percentage' 
            ? baseVal * (parseFloat(promo.value) / 100) 
            : Math.min(parseFloat(promo.value), baseVal);

        setAppliedPromo(promo);
        toast.success(`Promo "${promo.name}" diterapkan!`, {
            description: `Hemat ${formatRupiah(previewDiscount)}`,
            duration: 3000
        });
    };

    const removePromoCode = () => {
        const name = appliedPromo?.name || 'Promo';
        setAppliedPromo(null);
        setPromoCode('');
        toast.info(`Promo "${name}" dihapus.`);
    };

    const handleCheckout = async () => {
        if (!selectedCustomer || cart.length === 0) return;
        setIsProcessing(true);
        try {
            const payload = { customer_id: selectedCustomer.id, items: cart.map(item => ({ service_id: item.serviceId, qty: item.qty })), promo_code: appliedPromo?.code || null, payment_method: paymentMethod };
            const response = await (window as any).axios.post(route('transactions.store'), payload);
            const { snap_token } = response.data;
            if (paymentMethod === 'midtrans' && snap_token) {
                (window as any).snap.pay(snap_token, {
                    onSuccess: () => { confetti(); router.visit(route('transactions.index')); },
                    onPending: () => router.visit(route('transactions.index')),
                    onError: () => toast.error("Pembayaran gagal")
                });
            } else {
                confetti(); toast.success("Berhasil!"); router.visit(route('transactions.index'));
            }
        } catch (e: any) { toast.error("Error: " + (e.response?.data?.message || "Gagal")); }
        finally { setIsProcessing(false); }
    };

    return (
        <>
            <Head title="POS - Kasir Suara" />
            <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="mb-4 flex justify-between items-center pr-2">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Kasir (POS)</h2>
                            <p className="text-muted-foreground text-sm flex items-center gap-2">
                                <Keyboard className="h-3 w-3" /> Ctrl+F cari
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => window.history.back()}><ArrowLeft className="h-4 w-4 mr-2"/> Kembali</Button>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-4 pr-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input ref={searchInputRef} placeholder="Cari layanan..." className="pl-9" value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} />
                        </div>
                        <div className="flex bg-muted rounded-md p-1 gap-1">
                            {['all', 'kiloan', 'satuan'].map(tab => (
                                <button key={tab} onClick={() => setCategoryFilter(tab as any)} className={cn("px-3 text-xs font-medium rounded-sm capitalize", categoryFilter === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>{tab}</button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {filteredServices.map(service => (
                                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={service.id}>
                                        <SpotlightCard className="cursor-pointer hover:border-primary transition-all group">
                                            <div onClick={() => addToCart(service)}>
                                                <CardHeader className="p-4 pb-1">
                                                    <div className="flex justify-between items-start">
                                                        <CardTitle className="text-base group-hover:text-primary line-clamp-1">{service.name}</CardTitle>
                                                        <Badge variant="secondary" className="text-[10px]">/{service.unit}</Badge>
                                                    </div>
                                                    {service.description && (
                                                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{service.description}</p>
                                                    )}
                                                </CardHeader>
                                                <CardFooter className="p-4 pt-0 mt-2 flex justify-between items-center">
                                                    <span className="font-bold">{formatRupiah(parseFloat(service.price))}</span>
                                                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors"><Plus className="h-4 w-4" /></div>
                                                </CardFooter>
                                            </div>
                                        </SpotlightCard>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* KANAN: Cart */}
                <div className="w-full md:w-[380px] flex flex-col bg-card border rounded-xl shadow-lg h-full overflow-hidden">
                    <div className="p-4 border-b bg-muted/30">
                        <Label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Pelanggan</Label>
                        {isCustomerRole ? (
                            <div className="p-2 bg-background border rounded-md font-medium text-sm flex justify-between items-center">
                                <span>{selectedCustomer?.name || user.name}</span>
                                <Badge variant="secondary" className="text-[10px]">Anda</Badge>
                            </div>
                        ) : (
                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between bg-background">{selectedCustomer ? selectedCustomer.name : "Pilih Pelanggan..."}<ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" /></Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[340px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari..." />
                                        <CommandList>
                                            <CommandEmpty>Tidak ada.</CommandEmpty>
                                            <CommandGroup>{customers.map(c => <CommandItem key={c.id} onSelect={() => { setSelectedCustomer(c); setOpenCombobox(false); }}>{c.name}</CommandItem>)}</CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50 dark:bg-slate-900/20">
                        {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30"><ShoppingCart className="h-12 w-12 mb-2" /><p>Kosong</p></div> : cart.map(item => <CartItemRow key={item.serviceId} item={item} updateQty={updateQty} removeItem={removeItem} />)}
                    </div>

                    <div className="p-3 border-t bg-background space-y-2">
                        {/* Input Kode Promo */}
                        {appliedPromo ? (
                            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md px-2.5 py-1.5">
                                <TicketPercent className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 truncate block">{appliedPromo.name}</span>
                                </div>
                                <button onClick={removePromoCode} className="p-0.5 hover:bg-emerald-200/50 rounded transition-colors">
                                    <X className="h-3 w-3 text-emerald-600" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Input placeholder="Kode Promo" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="h-7 text-xs uppercase font-mono" />
                                <Button variant="secondary" size="sm" className="h-7 text-[10px] shrink-0 px-2.5" onClick={applyPromoCode} disabled={!promoCode.trim()}>Pakai</Button>
                            </div>
                        )}

                        {/* Breakdown Diskon */}
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between text-muted-foreground text-xs"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
                            
                            {/* Promo yang terapply */}
                            <AnimatePresence>
                                {discountInfo.applied.map((info) => (
                                    <motion.div 
                                        key={`applied-${info.promo.id}`}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                                            <span className="flex items-center gap-1 text-[11px]">
                                                {info.isCode ? <Tag className="h-2.5 w-2.5" /> : <Sparkles className="h-2.5 w-2.5" />}
                                                <span className="truncate max-w-[130px]">{info.promo.name}</span>
                                                <span className="text-[9px] opacity-70">({info.label})</span>
                                            </span>
                                            <span className="font-bold text-[11px]">-{formatRupiah(info.amount)}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {discountInfo.applied.length > 1 && (
                                <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-bold text-[11px] pt-0.5 border-t border-dashed border-emerald-200 dark:border-emerald-800">
                                    <span>Total Diskon</span><span>-{formatRupiah(discount)}</span>
                                </div>
                            )}

                            <Separator />
                            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary"><RollingNumber value={total} /></span></div>
                        </div>

                        {/* Hints: Promo yang belum memenuhi syarat — compact, max 2 items */}
                        <AnimatePresence>
                            {cart.length > 0 && discountInfo.ineligible.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-md p-2 space-y-1.5 max-h-[72px] overflow-y-auto">
                                        {discountInfo.ineligible.slice(0, 3).map((info) => (
                                            <div key={`hint-${info.promo.id}`} className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <Info className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                                                    <span className="text-[10px] text-amber-700 dark:text-amber-400 truncate">{info.promo.name}</span>
                                                </div>
                                                <span className="text-[9px] text-amber-600/70 dark:text-amber-500/70 shrink-0 whitespace-nowrap">{info.reason.split('(')[1]?.replace(')', '') || ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Payment Method */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant={paymentMethod === 'cash' ? 'default' : 'outline'} onClick={() => setPaymentMethod('cash')} className="flex-col h-auto py-1.5 gap-0.5"><Banknote className="h-4 w-4" /><span className="text-[10px]">Tunai</span></Button>
                            <Button variant={paymentMethod === 'midtrans' ? 'default' : 'outline'} onClick={() => setPaymentMethod('midtrans')} className="flex-col h-auto py-1.5 gap-0.5"><CreditCard className="h-4 w-4" /><span className="text-[10px]">Midtrans</span></Button>
                        </div>
                        <Button className="w-full h-10 font-bold text-base" disabled={isProcessing || cart.length === 0 || !selectedCustomer} onClick={handleCheckout}>{isProcessing ? <Loader2 className="animate-spin" /> : "Bayar"}</Button>
                    </div>
                </div>
            </div>
        </>
    );
}

TransactionCreate.layout = (page: any) => <AdminLayout children={page} />;
export default TransactionCreate;
