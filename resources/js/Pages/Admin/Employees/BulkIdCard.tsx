import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ArrowLeft } from 'lucide-react';

export default function BulkIdCard({ employees, title }: { employees: any[], title: string }) {
    const { app_settings } = usePage().props as any;
    const appName = app_settings?.app_name || 'LAUNDRY PRO';

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 font-sans">
            <Head title={title} />

            <div className="mb-6 flex gap-4 print:hidden z-50">
                <Link
                    href={route('employees.index')}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-md shadow hover:bg-gray-50 border border-gray-200"
                >
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </Link>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
                >
                    <Printer className="w-4 h-4" /> Cetak {employees.length} Kartu
                </button>
            </div>

            {/* Grid Container */}
            <div className="flex flex-wrap items-center justify-center gap-8 max-w-[1000px] mx-auto px-4 print:gap-4 print:max-w-none print:px-0 print-grid">
                {employees.map((employee: any) => (
                    <div key={employee.id} className="bg-white w-[300px] h-[480px] rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden relative flex flex-col items-center print:shadow-none print:border-gray-500 print-break-inside-avoid">
                        
                        {/* Header / Brand Area */}
                        <div className="bg-blue-600 w-full pt-6 pb-12 flex flex-col items-center rounded-b-[50%] relative z-0 print-brand-area print:!bg-blue-600">
                            <h1 className="text-white text-2xl font-bold tracking-widest drop-shadow-md text-center px-4">
                                {appName.toUpperCase()}
                            </h1>
                            <p className="text-blue-200 text-xs mt-1 uppercase tracking-wider">Staff Identity Card</p>
                        </div>

                        {/* Profile Picture */}
                        <div className="absolute top-[80px] z-10 w-28 h-28 bg-white rounded-full p-1 shadow-md print:shadow-none print:bg-white print:border-2 print:border-white">
                            <img 
                                src={employee.user?.avatar ? `/storage/${employee.user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.user.name || 'User')}&background=random&size=150`} 
                                alt="Profile" 
                                className="w-full h-full object-cover rounded-full"
                            />
                        </div>

                        {/* Info Area */}
                        <div className="mt-16 text-center w-full px-6 flex-grow flex flex-col justify-between pb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 leading-tight">
                                    {employee.user?.name || 'Unknown'}
                                </h2>
                                <p className="text-blue-600 font-medium text-sm mt-1 uppercase tracking-wide">
                                    {employee.position || 'Staff'}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                    NIP: {employee.nip || '-'}
                                </p>
                            </div>

                            {/* QR Code Section */}
                            <div className="flex flex-col items-center mt-4">
                                <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm inline-block print:shadow-none print:border-gray-300">
                                    <QRCodeSVG 
                                        value={employee.qr_token || 'INVALID'} 
                                        size={110}
                                        level={"H"}
                                        fgColor={"#1f2937"}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide">Scan for Attendance</p>
                            </div>
                        </div>

                        {/* Footer Stripe */}
                        <div className="h-3 w-full bg-blue-600 print:!bg-blue-600"></div>
                    </div>
                ))}
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 0.5cm; size: A4 portrait; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: transparent !important; }
                    .print\\:hidden { display: none !important; }
                    .min-h-screen { min-height: auto; padding: 0; display: block; background: transparent; }
                    
                    /* Pastikan kontainer flex berubah menjadi grid 2 kolom 2 baris stabil untuk print */
                    .print-grid {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 0.5cm !important;
                        max-width: 100% !important;
                        margin: 0 auto;
                        justify-items: center;
                    }

                    .print-break-inside-avoid { 
                        break-inside: avoid; 
                        page-break-inside: avoid; 
                        margin-bottom: 0 !important; 
                        transform: scale(0.95);
                        transform-origin: top center;
                    }
                }
            `}} />
        </div>
    );
}
