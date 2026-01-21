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
    const { midtrans_client_key } = usePage().props as any;
    
    // UI State
    const [serviceSearch, setServiceSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'kiloan' | 'satuan'>('all');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'midtrans'>('cash');
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Sound Hooks
    const { playSuccess, playAdd, playRemove, playError, speak } = useSynth();

    // Voice Recognition
    const processAddCommand = (input: string) => {
        const lowerInput = input.toLowerCase().replace('.', ','); // Fix decimal voice input
        
        // 1. Parse Quantity (e.g., "5", "5 kilo", "5.5")
        // Regex to find number at start
        const qtyMatch = lowerInput.match(/^(\d+([.,]\d+)?)/);
        let qty = 1;
        let searchName = lowerInput;

        if (qtyMatch) {
            qty = parseFloat(qtyMatch[0].replace(',', '.'));
            // Remove quantity and potential unit from search string
            searchName = lowerInput.replace(/^(\d+([.,]\d+)?)\s*(kilo|kg|pcs|potong|set|meter)?\s*/, '').trim();
        }

        // 2. Fuzzy Search Service
        // Simple matching: find service that contains the most words from searchName
        const searchWords = searchName.split(' ').filter(w => w.length > 1);
        
        const scoredServices = services.map(s => {
            const sName = s.name.toLowerCase();
            let score = 0;
            if (sName === searchName) score += 100; // Exact match
            if (sName.includes(searchName)) score += 50; // Partial match
            
            searchWords.forEach(word => {
                if (sName.includes(word)) score += 10;
            });
            return { service: s, score };
        });

        const bestMatch = scoredServices.sort((a, b) => b.score - a.score)[0];

        if (bestMatch && bestMatch.score > 0) {
            const service = bestMatch.service;
            
            setCart(prev => {
                const existing = prev.find(item => item.serviceId === service.id);
                if (existing) {
                    return prev.map(item => 
                        item.serviceId === service.id 
                            ? { ...item, qty: item.qty + qty }
                            : item
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
            speak(`Oke, menambahkan ${qty} ${service.unit} ${service.name}`);
            toast.success(`Suara: ${qty} ${service.unit} ${service.name}`);
        } else {
            playError();
            speak(`Layanan ${searchName} tidak ditemukan`);
            toast.error(`Layanan "${searchName}" tidak ditemukan.`);
        }
    };

    const processCustomerCommand = (name: string) => {
        const lowerName = name.toLowerCase();
        const customer = customers.find(c => c.name.toLowerCase().includes(lowerName));
        
        if (customer) {
            setSelectedCustomer(customer);
            playSuccess();
            speak(`Pelanggan terpilih, ${customer.name}`);
            toast.success(`Pelanggan: ${customer.name}`);
        } else {
            playError();
            speak(`Pelanggan ${name} tidak terdaftar`);
            toast.error(`Pelanggan "${name}" tidak ditemukan.`);
        }
    };

    const commands = [
        {
            command: 'tambah *',
            callback: (item: string) => processAddCommand(item)
        },
        {
            command: 'pesan *', // Alternative for 'tambah'
            callback: (item: string) => processAddCommand(item)
        },
        {
            command: 'atas nama *',
            callback: (name: string) => processCustomerCommand(name)
        },
        {
            command: 'pelanggan *',
            callback: (name: string) => processCustomerCommand(name)
        },
        {
            command: 'hapus *',
            callback: (item: string) => {
                const cartItem = cart.find(c => c.name.toLowerCase().includes(item.toLowerCase()));
                if (cartItem) {
                    removeItem(cartItem.serviceId);
                    toast.success(`Dihapus: ${cartItem.name}`);
                }
            }
        },
        {
            command: ['bayar', 'checkout', 'selesai', 'proses'],
            callback: () => {
                if (cart.length > 0 && selectedCustomer) {
                    speak("Siap, memulai proses pembayaran");
                    handleCheckout();
                } else {
                    playError();
                    speak("Maaf, keranjang masih kosong atau pelanggan belum dipilih");
                    toast.error("Gagal: Cek keranjang/pelanggan.");
                }
            }
        },
        {
            command: ['batal', 'tutup', 'stop', 'berhenti'],
            callback: () => {
                speak("Perintah suara dihentikan");
                SpeechRecognition.stopListening();
                toast.info("Suara dinonaktifkan.");
            }
        },
        {
            command: 'reset',
            callback: () => {
                if(confirm('Reset keranjang?')) {
                    setCart([]);
                    playRemove();
                }
            }
        }
    ];

    const { transcript, listening, browserSupportsSpeechRecognition, isMicrophoneAvailable } = useSpeechRecognition({ commands });

    // Toggle Mic
    const toggleMic = () => {
        if (listening) {
            SpeechRecognition.stopListening();
        } else {
            // Cek Secure Context
            if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                toast.error("Fitur Suara memerlukan HTTPS atau Localhost!", { 
                    description: "Browser memblokir mikrofon di koneksi HTTP biasa." 
                });
                // Tetap coba buka untuk menampilkan error di overlay
            }
            SpeechRecognition.startListening({ continuous: true, language: 'id-ID' });
            toast.info("Mendengarkan...", { description: "Coba: 'Tambah 5 kilo Cuci Komplit' atau 'Atas nama Budi'" });
        }
    };

    // Hotkeys
    useHotkeys('ctrl+f', (e) => { e.preventDefault(); searchInputRef.current?.focus(); });
    useHotkeys('esc', () => setServiceSearch(''));
    useHotkeys('ctrl+enter', () => { if(cart.length > 0 && selectedCustomer) handleCheckout(); });
    useHotkeys('ctrl+m', (e) => { e.preventDefault(); toggleMic(); });

    // Load Midtrans
    useEffect(() => {
        if (!midtrans_client_key) return;
        const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
        const script = document.createElement("script");
        script.src = snapScript;
        script.setAttribute("data-client-key", midtrans_client_key);
        script.async = true;
        document.body.appendChild(script);
        return () => { if (document.body.contains(script)) document.body.removeChild(script); };
    }, [midtrans_client_key]);

    // Filter Services
    const filteredServices = services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(serviceSearch.toLowerCase());
        const matchesCategory = categoryFilter === 'all' 
            ? true 
            : categoryFilter === 'kiloan' 
                ? (service.unit === 'kg' || service.unit === 'meter') 
                : (service.unit === 'pcs' || service.unit === 'set');
        return matchesSearch && matchesCategory;
    });

    const addToCart = (service: Service) => {
        setCart(prev => {
            const existing = prev.find(item => item.serviceId === service.id);
            if (existing) {
                return prev.map(item => 
                    item.serviceId === service.id 
                        ? { ...item, qty: item.qty + 1 }
                        : item
                );
            }
            return [...prev, {
                serviceId: service.id,
                name: service.name,
                price: parseFloat(service.price),
                unit: service.unit,
                qty: 1
            }];
        });
        playAdd(); // SFX
        toast.success(`${service.name} ditambahkan.`, { position: 'bottom-center' });
    };

    const updateQty = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.serviceId === id) {
                let step = 0.5;
                if (item.unit === 'pcs' || item.unit === 'set') step = 1;
                const isIncrement = delta > 0;
                const changeAmount = isIncrement ? step : -step;
                const newQty = Math.max(step, item.qty + changeAmount);
                return { ...item, qty: newQty };
            }
            return item;
        }));
        playAdd(); // SFX
    };

    const removeItem = (id: number) => {
        setCart(prev => prev.filter(item => item.serviceId !== id));
        playRemove(); // SFX
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

        const autoPromos = promotions.filter(p => !p.code);
        autoPromos.forEach(p => {
            let eligible = true;
            if (p.min_amount && subtotal < parseFloat(p.min_amount)) eligible = false;
            if (p.min_weight && totalWeightKg < parseFloat(p.min_weight)) eligible = false;
            if (eligible) disc += calculatePromoValue(p);
        });

        return Math.min(disc, subtotal);
    }, [cart, appliedPromo, subtotal, totalWeightKg, promotions]);

    const total = subtotal - discount;

    const applyPromoCode = () => {
        const promo = promotions.find(p => p.code === promoCode.toUpperCase());
        if (promo) {
            setAppliedPromo(promo);
            playSuccess(); // SFX
            toast.success("Kode promo diterapkan!");
        } else {
            playError();
            toast.error("Kode promo tidak valid.");
            setAppliedPromo(null);
        }
    };

    const handleCheckout = async () => {
        if (!selectedCustomer) {
            playError();
            toast.error("Pilih pelanggan terlebih dahulu.");
            return;
        }
        if (cart.length === 0) {
            playError();
            toast.error("Keranjang masih kosong.");
            return;
        }

        setIsProcessing(true);

        try {
            const payload = {
                customer_id: selectedCustomer.id,
                items: cart.map(item => ({ service_id: item.serviceId, qty: item.qty })),
                promo_code: appliedPromo?.code || null,
                payment_method: paymentMethod
            };

            const response = await window.axios.post(route('transactions.store'), payload);
            const { snap_token, transaction } = response.data;

            if (paymentMethod === 'midtrans' && snap_token) {
                window.snap.pay(snap_token, {
                    onSuccess: function(){
                        playSuccess(); // SFX
                        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                        // Toast dihapus, biarkan backend yang handle setelah redirect
                    },
                    onPending: function(){
                        toast.info("Menunggu pembayaran...");
                        router.visit(route('transactions.index'));
                    },
                    onError: function(){ 
                        playError();
                        toast.error("Pembayaran gagal!"); 
                    },
                    onClose: function(){ toast.warning("Popup ditutup."); }
                });
            } else {
                playSuccess(); // SFX
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                toast.success("Transaksi Cash Berhasil!");
                router.visit(route('transactions.index'));
            }
        } catch (error: any) {
            playError();
            toast.error("Gagal: " + (error.response?.data?.message || "Error"));
        } finally {
            setIsProcessing(false);
        }
    };

    const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    return (
        <>
            <Head title="Buat Transaksi Baru (POS)" />
            
            <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6">
                {/* KIRI: Katalog Layanan */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="mb-4 flex justify-between items-center pr-2">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                Kasir (POS) 
                            </h2>
                            <p className="text-muted-foreground text-sm">Pilih layanan. Tekan <kbd className="bg-muted px-1 rounded text-xs">Ctrl+F</kbd> cari, <kbd className="bg-muted px-1 rounded text-xs">Ctrl+M</kbd> suara.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant={listening ? "destructive" : "outline"} 
                                size="icon" 
                                onClick={toggleMic}
                                title={listening ? "Matikan Mic" : "Aktifkan Perintah Suara"}
                            >
                                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" onClick={() => window.history.back()}>
                                <ArrowLeft className="h-4 w-4 mr-2"/> Kembali
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-4 pr-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                ref={searchInputRef}
                                placeholder="Cari layanan..." 
                                className="pl-9 transition-all focus:ring-2 focus:ring-primary/20"
                                value={serviceSearch}
                                onChange={(e) => setServiceSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-muted rounded-md p-1 gap-1">
                            {['all', 'kiloan', 'satuan'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setCategoryFilter(tab as any)}
                                    className={cn("px-3 text-xs font-medium rounded-sm transition-all capitalize", categoryFilter === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 pb-4 scroll-smooth">
                        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {filteredServices.map(service => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        key={service.id}
                                    >
                                        <SpotlightCard className="cursor-pointer hover:border-primary hover:shadow-md transition-all group active:scale-[0.98] flex flex-col justify-between h-full" spotlightColor="rgba(59, 130, 246, 0.15)">
                                            <div onClick={() => addToCart(service)} className="h-full flex flex-col justify-between relative z-10">
                                                <CardHeader className="p-4 pb-2">
                                                    <div className="flex justify-between items-start">
                                                        <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-1">{service.name}</CardTitle>
                                                        <Badge variant="secondary" className="text-[10px] h-5">/{service.unit}</Badge>
                                                    </div>
                                                    <CardDescription className="text-xs line-clamp-2 h-[2.5em]">
                                                        {service.description || 'Tidak ada deskripsi'}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardFooter className="p-4 pt-0 mt-2">
                                                    <div className="w-full flex items-center justify-between font-bold text-lg">
                                                        {formatRupiah(parseFloat(service.price))}
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                                            <Plus className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                </CardFooter>
                                            </div>
                                        </SpotlightCard>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                        {filteredServices.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                <p>Layanan tidak ditemukan.</p>
                            </div>
                        )}
                        {/* Voice Hint Overlay */}
                        <AnimatePresence>
                            {listening && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                                >
                                    <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-background/90 border border-white/10 shadow-2xl max-w-2xl w-full mx-4">
                                        
                                        {/* Animation Icon */}
                                        <div className="relative flex items-center justify-center h-20 w-20">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500/20"></span>
                                            <div className="relative flex items-center justify-center h-16 w-16 bg-red-500 rounded-full shadow-lg shadow-red-500/50">
                                                <Mic className="h-8 w-8 text-white animate-pulse" />
                                            </div>
                                        </div>

                                        {/* Text Feedback */}
                                        <div className="text-center space-y-2 w-full">
                                            <h3 className="text-2xl font-bold text-foreground">Mendengarkan...</h3>
                                            
                                            {/* Security/Mic Warning */}
                                            {(!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') && (
                                                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 mb-2">
                                                    <strong>PERINGATAN:</strong> Mikrofon diblokir oleh Browser! <br/>
                                                    Fitur suara TIDAK BERFUNGSI di koneksi HTTP (IP Address). <br/>
                                                    Silakan akses lewat <code>http://localhost:5173</code> atau gunakan HTTPS.
                                                </div>
                                            )}

                                            {!isMicrophoneAvailable && (
                                                <div className="bg-orange-500/10 text-orange-600 text-sm p-3 rounded-lg border border-orange-500/20 mb-2">
                                                    <strong>Akses Mikrofon Ditolak/Tidak Tersedia.</strong> <br/>
                                                    Mohon izinkan akses mikrofon di pengaturan browser.
                                                </div>
                                            )}

                                            <div className="min-h-[60px] flex items-center justify-center">
                                                {transcript ? (
                                                    <p className="text-xl md:text-3xl font-medium text-primary break-words leading-relaxed">
                                                        "{transcript}"
                                                    </p>
                                                ) : (
                                                    <p className="text-muted-foreground italic text-lg animate-pulse">
                                                        Silakan bicara...
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Guide Chips */}
                                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                                            <Badge variant="secondary" className="px-3 py-1.5 text-sm pointer-events-none opacity-80">"Tambah 5 kg Cuci Komplit"</Badge>
                                            <Badge variant="secondary" className="px-3 py-1.5 text-sm pointer-events-none opacity-80">"Atas nama Budi"</Badge>
                                            <Badge variant="secondary" className="px-3 py-1.5 text-sm pointer-events-none opacity-80">"Bayar"</Badge>
                                        </div>

                                        {/* Close Button */}
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="mt-2 text-muted-foreground hover:text-destructive"
                                            onClick={toggleMic}
                                        >
                                            <MicOff className="mr-2 h-4 w-4" /> Batalkan (Klik tombol mic atau sebut "Batal")
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!browserSupportsSpeechRecognition && (
                            <div className="fixed bottom-4 right-4 z-50 bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
                                <MicOff className="h-5 w-5" />
                                <span className="font-medium">Browser Anda tidak mendukung fitur suara. Gunakan Chrome.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* KANAN: Cart & Checkout */}
                <div className="w-full md:w-[400px] flex flex-col bg-card border rounded-xl shadow-lg h-full overflow-hidden shrink-0">
                    <div className="p-4 border-b bg-muted/30">
                        <Label className="mb-2 block text-xs font-uppercase text-muted-foreground font-bold tracking-wider">PELANGGAN</Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full justify-between bg-background"
                                >
                                    {selectedCustomer
                                        ? <span className="font-medium">{selectedCustomer.name}</span>
                                        : <span className="text-muted-foreground font-normal">Pilih Pelanggan...</span>}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[360px] p-0">
                                <Command>
                                    <CommandInput placeholder="Cari nama atau no hp..." />
                                    <CommandList>
                                        <CommandEmpty>Pelanggan tidak ditemukan.</CommandEmpty>
                                        <CommandGroup>
                                            {customers.map((customer) => (
                                                <CommandItem
                                                    key={customer.id}
                                                    value={`${customer.name} ${customer.phone}`}
                                                    onSelect={() => {
                                                        setSelectedCustomer(customer);
                                                        setOpenCombobox(false);
                                                    }}
                                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedCustomer(customer); setOpenCombobox(false); }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0")} />
                                                    <div className="flex flex-col">
                                                        <span>{customer.name}</span>
                                                        <span className="text-xs text-muted-foreground">{customer.phone}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/20">
                        <AnimatePresence mode="popLayout">
                            {cart.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-40 space-y-2"
                                >
                                    <ShoppingCart className="h-16 w-16" />
                                    <p className="text-sm font-medium">Keranjang kosong</p>
                                </motion.div>
                            ) : (
                                cart.map(item => (
                                    <CartItemRow 
                                        key={item.serviceId} 
                                        item={item} 
                                        updateQty={updateQty} 
                                        removeItem={removeItem} 
                                    />
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-4 border-t bg-background shadow-up-lg z-10">
                        <div className="flex gap-2 mb-4">
                            <Input 
                                placeholder="Kode Voucher" 
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                                className="h-9 text-xs font-mono uppercase bg-muted/30 border-dashed"
                            />
                            <Button size="sm" variant="secondary" onClick={applyPromoCode} className="h-9 text-xs">Pakai</Button>
                        </div>
                        
                        <AnimatePresence>
                            {appliedPromo && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex justify-between items-center text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-md border border-emerald-200 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Check className="h-3 w-3" />
                                            <span className="font-medium">Hemat {appliedPromo.type === 'percentage' ? `${parseFloat(appliedPromo.value)}%` : formatRupiah(parseFloat(appliedPromo.value))}</span>
                                        </div>
                                        <button onClick={() => setAppliedPromo(null)} className="font-bold hover:underline opacity-70 hover:opacity-100">Hapus</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatRupiah(subtotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <span>Diskon</span>
                                    <span>- {formatRupiah(discount)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between text-xl font-bold pt-1">
                                <span>Total</span>
                                <span className="text-primary flex items-center">
                                    <RollingNumber value={total} />
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 border rounded-lg p-2 transition-all border-2",
                                    paymentMethod === 'cash' ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "border-muted hover:border-foreground/20 hover:bg-muted/50"
                                )}
                                onClick={() => setPaymentMethod('cash')}
                            >
                                <Banknote className="h-5 w-5" />
                                <span className="text-xs font-bold">Tunai</span>
                            </motion.button>
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 border rounded-lg p-2 transition-all border-2",
                                    paymentMethod === 'midtrans' ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "border-muted hover:border-foreground/20 hover:bg-muted/50"
                                )}
                                onClick={() => setPaymentMethod('midtrans')}
                            >
                                <CreditCard className="h-5 w-5" />
                                <span className="text-xs font-bold">QRIS / Bank</span>
                            </motion.button>
                        </div>

                        <div className="relative">
                            <Button 
                                className="w-full text-md font-bold h-12 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]" 
                                size="lg" 
                                onClick={handleCheckout}
                                disabled={isProcessing || cart.length === 0 || !selectedCustomer}
                            >
                                {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : `Bayar Sekarang`}
                            </Button>
                            <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-muted-foreground flex justify-center items-center gap-1">
                                <Keyboard className="h-3 w-3" /> Ctrl+Enter bayar • Ctrl+M suara
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

TransactionCreate.layout = (page: any) => <AdminLayout children={page} />;
export default TransactionCreate;