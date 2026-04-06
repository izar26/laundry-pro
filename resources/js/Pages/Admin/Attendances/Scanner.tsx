import React, { useEffect, useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';
import { Clock, CheckCircle, XCircle, AlertTriangle, FlipHorizontal, Camera, Loader2, Maximize } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';

export default function Scanner({ pagetitle, timeIn, timeOut }: { pagetitle: string, timeIn: string, timeOut: string }) {
    const [scanResult, setScanResult] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentTimeLocal, setCurrentTimeLocal] = useState(new Date());
    
    // UI States
    const [facingMode, setFacingMode] = useState<"environment" | "user">("user"); // Default user untuk laptop
    const [isMirrored, setIsMirrored] = useState(false); // Default tidak di-mirror agar teks terbaca
    const [isCameraStarting, setIsCameraStarting] = useState(false);
    
    // Camera List
    const [cameras, setCameras] = useState<any[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('auto');
    
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTimeLocal(new Date()), 1000);
        
        // Dapatkan daftar kamera saat kompenen dimuat
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length > 0) {
                setCameras(devices);
            }
        }).catch(err => console.log("Gagal memuat list kamera. Coba izinkan akses kamera terlebih dahulu."));

        return () => clearInterval(timer);
    }, []);

    // Init & Clean up Scanner
    useEffect(() => {
        if (dialogOpen) return;
        
        let isMounted = true;
        const prepareScanner = async () => {
            await stopScanner(); // Hentikan yang lama jika ada
            if (isMounted) await startScanner();
        };
        
        prepareScanner();

        return () => {
            isMounted = false;
            stopScanner();
        };
    }, [facingMode, selectedCameraId, dialogOpen]);

    const startScanner = async () => {
        setIsCameraStarting(true);
        if (!html5QrCodeRef.current) {
            html5QrCodeRef.current = new Html5Qrcode("scanner-video");
        }

        try {
            const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
            
            // Gunakan ID Khusus jika dipilih, jika auto gunakan resolusi facingMode
            if (selectedCameraId && selectedCameraId !== 'auto') {
                await html5QrCodeRef.current.start(selectedCameraId, config, onScanSuccess, onScanError);
            } else {
                await html5QrCodeRef.current.start({ facingMode: facingMode }, config, onScanSuccess, onScanError);
            }
            setIsScanning(true);
        } catch (err) {
            console.error("Camera start error:", err);
            // Fallback if environment cam fails on laptop
            if (facingMode === "environment" && selectedCameraId === 'auto') {
                setFacingMode("user");
            }
        } finally {
            setIsCameraStarting(false);
        }
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
        setIsScanning(false);
    };

    const onScanSuccess = (qrToken: string) => {
        stopScanner();
        
        // Process to backend
        axios.post(route('attendances.record'), { qr_token: qrToken })
            .then(response => {
                setScanResult({
                    success: true,
                    message: response.data.message,
                    employeeName: response.data.employee,
                    type: response.data.type,
                    lateMinutes: response.data.late_minutes || 0,
                });
                setDialogOpen(true);
            })
            .catch(error => {
                setScanResult({
                    success: false,
                    message: error.response?.data?.message || 'Terjadi kesalahan saat memproses absen.',
                });
                setDialogOpen(true);
            });
    };

    const onScanError = (err: any) => { };

    const closeDialog = () => {
        setDialogOpen(false); // will trigger useEffect to startScanner
    };

    return (
        <AdminLayout>
            <Head title={pagetitle} />
            <div className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
                
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Panel - Clock & Info Widget */}
                    <div className="w-full lg:w-1/3 space-y-6">
                        <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-8 border border-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                            
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="p-3 bg-blue-50 rounded-full mb-4">
                                    <Clock className="w-10 h-10 text-blue-600" />
                                </div>
                                <h3 className="text-gray-500 font-medium text-sm tracking-widest uppercase">Live Time</h3>
                                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 tracking-tight my-4">
                                    {currentTimeLocal.toLocaleTimeString('id-ID', { hour12: false })}
                                </div>
                                <Badge variant="outline" className="text-gray-500 border-gray-200">
                                    {currentTimeLocal.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </Badge>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl rounded-3xl p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
                            <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                                <Clock className="w-5 h-5" /> Jadwal Kehadiran
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                                    <span className="text-blue-100 text-sm">Jam Masuk</span>
                                    <span className="font-extrabold text-lg">{timeIn}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                                    <span className="text-blue-100 text-sm">Jam Pulang</span>
                                    <span className="font-extrabold text-lg">{timeOut}</span>
                                </div>
                            </div>
                            <div className="mt-6 flex items-start gap-2 bg-black/20 p-3 rounded-lg text-xs text-blue-100">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-orange-300" />
                                <p>Sistem otomatis mencatat menit keterlambatan jika scan di atas jam masuk.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Scanner Widget */}
                    <div className="w-full lg:w-2/3">
                        <div className="bg-white shadow-xl rounded-3xl overflow-hidden h-full flex flex-col border border-gray-100">
                            
                            {/* Header Section */}
                            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{pagetitle}</h2>
                                    <p className="text-gray-500 text-sm mt-1">Arahkan ID Card Pegawai ke dalam kotak.</p>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                    {cameras.length > 0 && (
                                        <select 
                                            value={selectedCameraId} 
                                            onChange={(e) => setSelectedCameraId(e.target.value)}
                                            className="border border-gray-200 text-sm rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex-1 min-w-[120px]"
                                        >
                                            <option value="auto">Auto / Default</option>
                                            {cameras.map((cam, idx) => (
                                                <option key={cam.id} value={cam.id}>
                                                    {cam.label || `Kamera ${idx + 1}`}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <Button 
                                        variant={isMirrored ? "default" : "outline"}
                                        size="sm" 
                                        onClick={() => setIsMirrored(!isMirrored)}
                                        className="rounded-xl h-[38px]"
                                        title="Mirror Video"
                                    >
                                        <FlipHorizontal className="w-4 h-4 mr-2" />
                                        Mirror
                                    </Button>
                                    {selectedCameraId === 'auto' && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setFacingMode(prev => prev === "environment" ? "user" : "environment")}
                                            className="rounded-xl h-[38px] hidden sm:flex"
                                            title="Ganti (Depan/Belakang)"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Camera Section */}
                            <div className="flex-grow bg-gray-900 relative flex items-center justify-center p-4 lg:p-8 min-h-[400px]">
                                
                                {isCameraStarting && !isScanning && (
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm text-white">
                                        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                                        <p className="font-medium animate-pulse">Menyiapkan Kamera...</p>
                                    </div>
                                )}

                                {/* Scanner Container */}
                                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800 w-full max-w-[500px] aspect-square object-cover">
                                    
                                    {/* The Video Element Container */}
                                    <div 
                                        id="scanner-video" 
                                        className="w-full h-full bg-black"
                                        style={{ transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)', transition: 'transform 0.3s ease' }}
                                    ></div>
                                    
                                    {/* Professional Scan Overlay */}
                                    {isScanning && (
                                        <div className="absolute inset-0 z-10 pointer-events-none">
                                            {/* Target Box */}
                                            <div className="absolute inset-0 flex justify-center items-center">
                                                <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-dashed border-white/50 rounded-3xl relative">
                                                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
                                                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
                                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>
                                                    
                                                    {/* Animated Laser Line */}
                                                    <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_2px_rgba(16,185,129,0.7)] animate-scan"></div>
                                                </div>
                                            </div>
                                            {/* Corner Status */}
                                            <div className="absolute top-4 right-4 bg-emerald-500/20 backdrop-blur-md text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-2 shadow-lg">
                                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                                                SCAN ACTIVE
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Popup Dialog untuk Hasil */}
            <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="sm:max-w-md text-center border-0 shadow-2xl p-0 overflow-hidden">
                    <div className={`h-3 w-full ${scanResult?.success ? (scanResult.type === 'in' && scanResult.lateMinutes > 0 ? 'bg-orange-500' : 'bg-emerald-500') : 'bg-red-500'}`}></div>
                    
                    <div className="py-10 px-6 flex flex-col items-center justify-center relative">
                        {/* Decorative Background Glow */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none ${scanResult?.success ? (scanResult.type === 'in' && scanResult.lateMinutes > 0 ? 'bg-orange-500' : 'bg-emerald-500') : 'bg-red-500'}`}></div>

                        {scanResult?.success ? (
                            <>
                                {scanResult.type === 'in' ? (
                                    scanResult.lateMinutes > 0 ? (
                                        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-orange-500/20">
                                            <AlertTriangle className="w-12 h-12 text-orange-500" strokeWidth={2} />
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                                            <CheckCircle className="w-12 h-12 text-emerald-500" strokeWidth={2} />
                                        </div>
                                    )
                                ) : (
                                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                                        <CheckCircle className="w-12 h-12 text-blue-500" strokeWidth={2} />
                                    </div>
                                )}
                                
                                <h3 className="text-3xl font-black text-gray-900 mb-1">{scanResult.employeeName}</h3>
                                <p className="text-md font-bold text-gray-400 mb-6 uppercase tracking-widest">{scanResult.message}</p>
                                
                                {scanResult.type === 'in' && scanResult.lateMinutes > 0 && (
                                    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/60 text-orange-800 p-4 rounded-2xl w-full shadow-sm">
                                        <p className="font-black text-lg flex items-center justify-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-orange-500" /> Terlambat {scanResult.lateMinutes} Menit
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-500/20">
                                    <XCircle className="w-12 h-12 text-red-500" strokeWidth={2} />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 mb-2">Scan Gagal!</h3>
                                <p className="text-gray-600 font-medium">{scanResult?.message}</p>
                            </>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50 border-t flex justify-center">
                        <Button type="button" onClick={closeDialog} size="lg" className="w-full sm:w-2/3 rounded-xl font-bold shadow-md">
                            Tutup & Lanjutkan Scan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Custom Styles for Scanner & Animation */}
            <style dangerouslySetInnerHTML={{__html: `
                #scanner-video video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
                @keyframes scan {
                    0% { top: 10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 90%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 2.5s cubic-bezier(0.53, 0.21, 0.29, 0.67) infinite;
                }
            `}} />
        </AdminLayout>
    );
}
