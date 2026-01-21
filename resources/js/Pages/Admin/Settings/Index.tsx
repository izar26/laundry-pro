import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/Components/ui/card';
import { Loader2, Upload, Store, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';
import { Separator } from '@/Components/ui/separator';
import { motion } from 'framer-motion';

function SettingsIndex({ settings }: { settings: any }) {
    const { data, setData, post, processing, errors } = useForm({
        app_name: settings.app_name || '',
        app_phone: settings.app_phone || '',
        app_address: settings.app_address || '',
        app_logo: null as File | null,
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(
        settings.app_logo ? `/storage/${settings.app_logo}` : null
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('app_logo', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.update'), {
            preserveScroll: true,
            onSuccess: () => {
                window.location.reload(); 
            }
        });
    };

    return (
        <>
            <Head title="Info Laundry" />

            <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
                {/* Kolom Kiri: Form */}
                <div className="flex-1 space-y-6">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Info Laundry</h2>
                        <p className="text-muted-foreground">Identitas usaha yang akan tampil di struk dan aplikasi.</p>
                    </div>

                    <Card className="border-t-4 border-t-primary shadow-lg">
                        <CardHeader>
                            <CardTitle>Edit Profil</CardTitle>
                            <CardDescription>Masukkan detail terbaru laundry Anda.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Logo Usaha</Label>
                                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20 border-dashed">
                                        <div className="h-20 w-20 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-white overflow-hidden shrink-0">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                                            ) : (
                                                <Store className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Button type="button" variant="outline" size="sm" className="relative z-10 pointer-events-none">
                                                    <Upload className="h-4 w-4 mr-2" /> Pilih Gambar
                                                </Button>
                                                <Input 
                                                    id="app_logo" 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-2">
                                                Format JPG/PNG. Maks 2MB.
                                            </p>
                                        </div>
                                    </div>
                                    {errors.app_logo && <p className="text-xs text-destructive">{errors.app_logo}</p>}
                                </div>

                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="app_name">Nama Laundry</Label>
                                        <Input 
                                            id="app_name" 
                                            value={data.app_name} 
                                            onChange={(e) => setData('app_name', e.target.value)} 
                                            placeholder="Contoh: Berkah Laundry"
                                            className="font-medium text-lg"
                                        />
                                        {errors.app_name && <p className="text-xs text-destructive">{errors.app_name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="app_phone">Kontak HP/WA</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="app_phone" 
                                                value={data.app_phone} 
                                                onChange={(e) => setData('app_phone', e.target.value)} 
                                                className="pl-9"
                                                placeholder="0812..."
                                            />
                                        </div>
                                        {errors.app_phone && <p className="text-xs text-destructive">{errors.app_phone}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="app_address">Alamat Lengkap</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Textarea 
                                                id="app_address" 
                                                value={data.app_address} 
                                                onChange={(e) => setData('app_address', e.target.value)} 
                                                className="resize-none h-24 pl-9 pt-2"
                                                placeholder="Jalan..."
                                            />
                                        </div>
                                        {errors.app_address && <p className="text-xs text-destructive">{errors.app_address}</p>}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={processing} size="lg" className="w-full sm:w-auto">
                                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Simpan Perubahan
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Kolom Kanan: Live Preview Struk */}
                <div className="lg:w-[350px] space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold tracking-tight">Preview Struk</h3>
                        <p className="text-sm text-muted-foreground">Tampilan header pada struk fisik.</p>
                    </div>
                    
                    <motion.div 
                        layout
                        className="bg-white text-black p-6 shadow-2xl rounded-sm border border-gray-200 font-mono text-xs w-full max-w-[300px] mx-auto relative transform rotate-1 hover:rotate-0 transition-transform duration-500"
                    >
                        {/* Efek Kertas Sobek */}
                        <div className="absolute -bottom-2 left-0 right-0 h-4 bg-white" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>

                        <div className="text-center space-y-2 mb-4">
                            <h2 className="text-xl font-bold uppercase tracking-wide">
                                {data.app_name || 'NAMA LAUNDRY'}
                            </h2>
                            <p className="px-4 leading-tight">
                                {data.app_address || 'Alamat laundry akan muncul di sini.'}
                            </p>
                            <p>{data.app_phone || '08xx-xxxx-xxxx'}</p>
                        </div>

                        <div className="border-t border-dashed border-black my-4"></div>

                        <div className="space-y-1">
                            <div className="flex justify-between"><span>No: TRX-SAMPLE</span></div>
                            <div className="flex justify-between"><span>Tgl: 21/01/2026</span></div>
                            <div className="flex justify-between"><span>Kasir: Admin</span></div>
                        </div>

                        <div className="border-t border-dashed border-black my-4"></div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Cuci Kiloan</span>
                                <span>15.000</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Cuci Karpet</span>
                                <span>50.000</span>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-black my-4"></div>

                        <div className="flex justify-between font-bold text-sm">
                            <span>TOTAL</span>
                            <span>65.000</span>
                        </div>

                        <div className="mt-8 text-center opacity-60">
                            <p>*** TERIMA KASIH ***</p>
                            <div className="w-20 h-20 bg-gray-100 mx-auto flex items-center justify-center border text-[8px] text-gray-400 mt-2">
                                [QR CODE]
                            </div>
                            <p className="opacity-60 pt-4 text-center">Pakaian tidak diambil &gt; 30 hari di luar tanggung jawab kami.</p>
                        </div>
                    </motion.div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                        <p className="font-semibold mb-1">💡 Tips:</p>
                        <p>Pastikan nama usaha singkat dan jelas agar muat di kertas struk 58mm.</p>
                    </div>
                </div>
            </div>
        </>
    );
}

SettingsIndex.layout = (page: any) => <AdminLayout children={page} />;
export default SettingsIndex;