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
    MicOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import confetti from 'canvas-confetti';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import useSynth from '@/hooks/useSynth';
import Fuse from 'fuse.js';

// Tipe Data
type Customer = { id: number; name: string; phone: string };
type Service = { id: number; name: string; price: string; unit: string; description: string };
type Promotion = { 
    id: number; 
    code: string; 
    type: string; 
    value: string; 
    min_weight?: string; 
    min_amount?: string;
    service_id?: number;
};

type CartItem = {
    serviceId: number;
    name: string;
    price: number;
    unit: string;
    qty: number;
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
    const [voiceStatus, setVoiceStatus] = useState<string>('Siap mendengarkan...');

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

    // Sound Hooks
    const { playSuccess, playAdd, playRemove, playError, speak } = useSynth();

    // Voice Handlers
    const processAddCommand = (input: string) => {
        setVoiceStatus(`Memproses: "${input}"...`);
        const lowerInput = input.toLowerCase().replace('.', ','); 
        
        const qtyMatch = lowerInput.match(/^(\d+([.,]\d+)?)/);
        let qty = 1;
        let searchName = lowerInput;

        if (qtyMatch) {
            qty = parseFloat(qtyMatch[0].replace(',', '.'));
            searchName = lowerInput.replace(/^(\d+([.,]\d+)?)\s*(kilo|kg|pcs|potong|set|meter|buah)?\s*/, '').trim();
        }

        const results = serviceFuse.search(searchName);
        
        if (results.length > 0) {
            const service = results[0].item;
            setCart(prev => {
                const existing = prev.find(item => item.serviceId === service.id);
                if (existing) {
                    return prev.map(item => 
                        item.serviceId === service.id ? { ...item, qty: item.qty + qty } : item
                    );
                }
                return [...prev, {
                    serviceId: service.id,
                    name: service.name,
                    price: parseFloat(service.price),
                    unit: service.unit,
                    qty: qty
                }];
            });
            playAdd();
            const response = `Oke, ${qty} ${service.unit} ${service.name}`;
            speak(response);
            setVoiceStatus(response);
            toast.success(response);
        } else {
            playError();
            const msg = `Maaf, tidak menemukan layanan "${searchName}"`;
            speak(msg);
            setVoiceStatus(msg);
            toast.error(msg);
        }
    };

    const processCustomerCommand = (name: string) => {
        setVoiceStatus(`Mencari pelanggan: "${name}"...`);
        const results = customerFuse.search(name);
        if (results.length > 0) {
            const customer = results[0].item;
            setSelectedCustomer(customer);
            playSuccess();
            const msg = `Pelanggan terpilih: ${customer.name}`;
            speak(msg);
            setVoiceStatus(msg);
            toast.success(msg);
        } else {
            playError();
            const msg = `Maaf, tidak menemukan pelanggan bernama ${name}`;
            speak(msg);
            setVoiceStatus(msg);
            toast.error(msg);
        }
    };

    const commands = [
        { command: ['tambah *', 'pesan *', 'masukkan *', 'input *'], callback: (item: string) => processAddCommand(item) },
        { command: ['atas nama *', 'pelanggan *', 'customer *', 'pembeli *'], callback: (name: string) => processCustomerCommand(name) },
        {
            command: ['hapus *', 'buang *', 'cancel *'],
            callback: (item: string) => {
                const cartFuse = new Fuse(cart, { keys: ['name'], threshold: 0.4 });
                const results = cartFuse.search(item);
                if (results.length > 0) {
                    const cartItem = results[0].item;
                    removeItem(cartItem.serviceId);
                    const msg = `Menghapus ${cartItem.name}`;
                    speak(msg);
                    setVoiceStatus(msg);
                    toast.success(msg);
                } else {
                    speak("Barang tidak ada di keranjang");
                }
            }
        },
        {
            command: ['bayar', 'checkout', 'selesai', 'proses', 'transaksi'],
            callback: () => {
                if (cart.length > 0 && selectedCustomer) {
                    speak("Siap, memproses pembayaran");
                    setVoiceStatus("Memproses Pembayaran...");
                    handleCheckout();
                } else {
                    playError();
                    let msg = "Gagal. Keranjang kosong atau pelanggan belum dipilih.";
                    speak(msg);
                    setVoiceStatus(msg);
                    toast.error(msg);
                }
            }
        },
        {
            command: ['batal', 'tutup', 'stop', 'berhenti', 'matikan'],
            callback: () => {
                speak("Mikrofon dimatikan");
                SpeechRecognition.stopListening();
                setVoiceStatus("Nonaktif");
            }
        },
        {
            command: 'reset',
            callback: () => {
                if(confirm('Reset keranjang?')) {
                    setCart([]);
                    playRemove();
                    speak("Keranjang dikosongkan");
                }
            }
        },
        {
            command: '*',
            callback: (command: string) => {
                if (!command || command.length < 2) return;
                setVoiceStatus(`Tidak mengerti: "${command}"`);
            }
        }
    ];

    const { transcript, listening, browserSupportsSpeechRecognition, isMicrophoneAvailable } = useSpeechRecognition({ commands });

    useEffect(() => {
        if (listening) {
            if (transcript) setVoiceStatus(`Mendengar: "${transcript}"`);
            else setVoiceStatus("Mendengarkan...");
        }
    }, [transcript, listening]);

    const toggleMic = () => {
        if (listening) {
            SpeechRecognition.stopListening();
        } else {
            if (!window.isSecureContext && window.location.hostname !== 'localhost') {
                toast.error("Fitur Suara memerlukan HTTPS atau Localhost!");
            }
            SpeechRecognition.startListening({ continuous: true, language: 'id-ID' });
            toast.info("Mendengarkan...", { description: "Coba: 'Tambah 5 kilo Cuci Komplit'" });
        }
    };

    // Hotkeys
    useHotkeys('ctrl+f', (e) => { e.preventDefault(); searchInputRef.current?.focus(); });
    useHotkeys('ctrl+m', (e) => { e.preventDefault(); toggleMic(); });
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
        playAdd();
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
        playAdd();
    };

    const removeItem = (id: number) => {
        setCart(prev => prev.filter(item => item.serviceId !== id));
        playRemove();
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const totalWeightKg = cart.filter(item => item.unit === 'kg').reduce((acc, item) => acc + item.qty, 0);

    const discount = useMemo(() => {
        let disc = 0;
        const calculatePromoValue = (p: Promotion) => {
            let baseVal = subtotal;
            if (p.service_id) {
                const targetItems = cart.filter(i => i.serviceId === p.service_id);
                if (targetItems.length === 0) return 0;
                baseVal = targetItems.reduce((acc, i) => acc + (i.price * i.qty), 0);
            }
            return p.type === 'percentage' ? baseVal * (parseFloat(p.value) / 100) : parseFloat(p.value);
        };
        if (appliedPromo) disc += calculatePromoValue(appliedPromo);
        promotions.filter(p => !p.code).forEach(p => {
            if ((!p.min_amount || subtotal >= parseFloat(p.min_amount)) && (!p.min_weight || totalWeightKg >= parseFloat(p.min_weight))) {
                disc += calculatePromoValue(p);
            }
        });
        return Math.min(disc, subtotal);
    }, [cart, appliedPromo, subtotal, totalWeightKg, promotions]);

    const total = subtotal - discount;

    const applyPromoCode = () => {
        const promo = promotions.find(p => p.code === promoCode.toUpperCase());
        if (promo) { setAppliedPromo(promo); playSuccess(); toast.success("Promo OK!"); }
        else { playError(); toast.error("Promo Gagal!"); setAppliedPromo(null); }
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
                    onSuccess: () => { playSuccess(); confetti(); router.visit(route('transactions.index')); },
                    onPending: () => router.visit(route('transactions.index')),
                    onError: () => playError()
                });
            } else {
                playSuccess(); confetti(); toast.success("Berhasil!"); router.visit(route('transactions.index'));
            }
        } catch (e: any) { playError(); toast.error("Error: " + (e.response?.data?.message || "Gagal")); }
        finally { setIsProcessing(false); }
    };

    const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    return (
        <>
            <Head title="POS - Kasir Suara" />
            <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="mb-4 flex justify-between items-center pr-2">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Kasir (POS)</h2>
                            <p className="text-muted-foreground text-sm flex items-center gap-2">
                                <Keyboard className="h-3 w-3" /> Ctrl+F cari, Ctrl+M suara
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant={listening ? "destructive" : "outline"} size="icon" onClick={toggleMic}>
                                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </Button>
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
                                                <CardHeader className="p-4 pb-2">
                                                    <div className="flex justify-between items-start">
                                                        <CardTitle className="text-base group-hover:text-primary line-clamp-1">{service.name}</CardTitle>
                                                        <Badge variant="secondary" className="text-[10px]">/{service.unit}</Badge>
                                                    </div>
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
                        
                        {/* Panel Asisten Suara (Modern & Non-Blocking) */}
                        <AnimatePresence>
                            {listening && (
                                <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center px-4">
                                    <div className="bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-black backdrop-blur shadow-2xl rounded-2xl p-4 flex items-center gap-4 max-w-xl w-full border border-white/10">
                                        <div className="relative h-10 w-10 flex items-center justify-center bg-red-500 rounded-full">
                                            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50"></span>
                                            <Mic className="h-5 w-5 text-white relative z-10" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold uppercase opacity-50">Sistem Mendengar</p>
                                            <p className="text-lg font-medium truncate">{voiceStatus}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={toggleMic} className="rounded-full hover:bg-white/10"><MicOff className="h-5 w-5" /></Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {(!window.isSecureContext && window.location.hostname !== 'localhost') && (
                            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-destructive text-white p-4 rounded-xl shadow-2xl text-center">
                                <strong>Gunakan Localhost atau HTTPS!</strong><br/>Browser memblokir mic di alamat IP.
                            </div>
                        )}
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

                    <div className="p-4 border-t bg-background">
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
                            {discount > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Diskon</span><span>-{formatRupiah(discount)}</span></div>}
                            <Separator />
                            <div className="flex justify-between text-xl font-bold pt-1"><span>Total</span><span className="text-primary"><RollingNumber value={total} /></span></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <Button variant={paymentMethod === 'cash' ? 'default' : 'outline'} onClick={() => setPaymentMethod('cash')} className="flex-col h-auto py-2 gap-1"><Banknote className="h-4 w-4" /><span className="text-[10px]">Tunai</span></Button>
                            <Button variant={paymentMethod === 'midtrans' ? 'default' : 'outline'} onClick={() => setPaymentMethod('midtrans')} className="flex-col h-auto py-2 gap-1"><CreditCard className="h-4 w-4" /><span className="text-[10px]">QRIS</span></Button>
                        </div>
                        <Button className="w-full h-12 font-bold text-lg" disabled={isProcessing || cart.length === 0 || !selectedCustomer} onClick={handleCheckout}>{isProcessing ? <Loader2 className="animate-spin" /> : "Bayar"}</Button>
                    </div>
                </div>
            </div>
        </>
    );
}

TransactionCreate.layout = (page: any) => <AdminLayout children={page} />;
export default TransactionCreate;
