import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FileDown, Calendar as CalendarIcon, FilterX, Clock, AlertTriangle, CheckCircle, CopyX } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { format, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { SimpleCalendar as Calendar } from "@/Components/ui/simple-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { cn } from "@/lib/utils";
import axios from 'axios';
import { toast } from 'sonner';

export default function Index({ attendances: initialAttendances, employees, filters }: any) {
    const [attendances, setAttendances] = useState(initialAttendances);
    const [isLoading, setIsLoading] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 25;
    
    // Date Range logic
    const [date, setDate] = useState<any>({
        from: filters.start_date ? new Date(filters.start_date) : new Date(),
        to: filters.end_date ? new Date(filters.end_date) : new Date(),
    });

    const [employeeId, setEmployeeId] = useState(filters.employee_id);
    const [status, setStatus] = useState(filters.status);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch data via Axios
    const applyFilters = async (sDate?: Date, eDate?: Date, eId: string = employeeId, st: string = status) => {
        setIsLoading(true);
        setCurrentPage(1); // Reset to page 1 on filter
        
        const sd = sDate ? format(sDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        const ed = eDate ? format(eDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        
        try {
            const response = await axios.get(route('attendances.index'), {
                params: { start_date: sd, end_date: ed, employee_id: eId, status: st },
                headers: { 'Accept': 'application/json' }
            });
            setAttendances(response.data.attendances);
            
            // Perbarui URL params untuk history
            const url = new URL(window.location.href);
            url.searchParams.set('start_date', sd);
            url.searchParams.set('end_date', ed);
            url.searchParams.set('employee_id', eId);
            url.searchParams.set('status', st);
            window.history.pushState({}, '', url.toString());

        } catch (error) {
            console.error("Gagal memuat filter", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto apply when date range changes and is completely selected
    useEffect(() => {
        if (date?.from && date?.to) {
            applyFilters(date.from, date.to, employeeId, status);
        }
    }, [date?.from, date?.to]);

    const handleExport = () => {
        const url = new URL(route('attendances.export'), window.location.origin);
        if (date?.from) url.searchParams.set('start_date', format(date.from, 'yyyy-MM-dd'));
        if (date?.to) url.searchParams.set('end_date', format(date.to, 'yyyy-MM-dd'));
        url.searchParams.append('employee_id', employeeId);
        url.searchParams.append('status', status);
        window.open(url.toString(), '_blank');
    };

    const updateStatus = async (employee_id: number, targetDate: string, newStatus: string) => {
        // Optimistic UI updates
        const prevAttendances = [...attendances];
        setAttendances(attendances.map((att: any) => {
            if (att.employee_id === employee_id && att.date === targetDate) {
                return { ...att, status: newStatus };
            }
            return att;
        }));

        try {
            await axios.post(route('attendances.update-status'), {
                employee_id: employee_id,
                date: targetDate,
                status: newStatus
            });
            toast.success("Status absensi berhasil diekskusi.");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Gagal menyimpan status.");
            setAttendances(prevAttendances); // Revert
        }
    };

    // Filter employees based on search
    const filteredEmployees = employees.filter((emp: any) => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.nip?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Pagination Data
    const totalPages = Math.ceil(attendances.length / perPage);
    const paginatedData = attendances.slice((currentPage - 1) * perPage, currentPage * perPage);

    return (
        <AdminLayout>
            <Head title="Laporan Absensi Karyawan" />
            
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header Component */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Data Laporan Absensi</h2>
                            <p className="text-muted-foreground mt-1">Sistem lengkap manajemen dan validasi riwayat absensi harian.</p>
                        </div>
                    </div>

                    {/* Toolbar (Financial Report Template Style) */}
                    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-background/60 backdrop-blur-sm border rounded-xl p-3 shadow-sm sticky top-4 z-30 ring-1 ring-border/50">
                        {/* Left: Date Picker */}
                        <div className="flex items-center gap-3 w-full xl:w-auto">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button id="date" variant={"outline"} className={cn("w-full sm:w-[260px] justify-start text-left font-normal h-10", !date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? <>{format(date.from, "dd MMM")} - {format(date.to, "dd MMM yyyy")}</> : format(date.from, "dd MMM yyyy")
                                        ) : <span>Pilih Tanggal Laporan</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} />
                                </PopoverContent>
                            </Popover>
                            
                            <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>
                            
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-10 text-left justify-start w-full sm:w-[220px] font-normal" title="Pilih Pegawai">
                                        <span className="truncate">{employeeId === 'all' ? "Semua Pegawai" : (employees.find((e:any) => e.id == employeeId)?.name || "Pilih Pegawai")}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-2" align="start">
                                    <input 
                                        className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mb-2 focus-visible:outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="Cari nama / nip pegawai..."
                                        value={searchTerm}
                                        autoFocus
                                        onChange={(e) => setSearchTerm(e.target.value)} 
                                    />
                                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                                        <button 
                                            className={cn("w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted font-bold", employeeId === 'all' && 'bg-primary/10 text-primary')}
                                            onClick={() => { setEmployeeId('all'); applyFilters(date?.from, date?.to, 'all', status); }}
                                        >
                                            -- Semua Pegawai --
                                        </button>
                                        {filteredEmployees.map((emp: any) => (
                                            <button 
                                                key={emp.id}
                                                className={cn("w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted", employeeId == emp.id && 'bg-primary/10 text-primary')}
                                                onClick={() => { setEmployeeId(emp.id); applyFilters(date?.from, date?.to, String(emp.id), status); }}
                                            >
                                                {emp.name} <span className="text-xs text-muted-foreground ml-1">({emp.nip})</span>
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <select 
                                className="h-10 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm max-w-[150px] outline-none"
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    applyFilters(date?.from, date?.to, employeeId, e.target.value);
                                }}
                            >
                                <option value="all">Semua Status</option>
                                <option value="present">Tepat Waktu (Hadir)</option>
                                <option value="late">Terlambat (Late)</option>
                                <option value="alfa">Tanpa Keterangan (Alfa)</option>
                                <option value="sakit">Sakit</option>
                                <option value="izin">Izin</option>
                                <option value="cuti">Cuti</option>
                            </select>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
                            <Button size="sm" variant="ghost" onClick={() => applyFilters(date?.from, date?.to, 'all', 'all')} title="Reset Filter" className="h-10 w-10 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"><FilterX className="h-4 w-4"/></Button>
                            <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>
                            <Button size="sm" variant="outline" onClick={handleExport} className="h-10 gap-2 border-dashed border-emerald-500/50 hover:bg-emerald-50 text-emerald-700">
                                <FileDown className="h-4 w-4" /> <span className="hidden sm:inline font-bold">Unduh .XLSX</span>
                            </Button>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
                        
                        <div className="overflow-x-auto relative">
                            {isLoading && (
                                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-20 flex items-center justify-center pointer-events-none">
                                    <div className="bg-white shadow-xl p-4 rounded-full flex items-center gap-3 ring-1 ring-border">
                                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <span className="font-bold text-sm text-gray-700 animate-pulse">Menyiapkan Rekapan...</span>
                                    </div>
                                </div>
                            )}

                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-600 uppercase bg-gray-50/50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Tanggal</th>
                                        <th className="px-6 py-4 font-bold">Nama Pegawai & NIP</th>
                                        <th className="px-6 py-4 font-bold text-center">Waktu Masuk</th>
                                        <th className="px-6 py-4 font-bold text-center">Waktu Pulang</th>
                                        <th className="px-6 py-4 font-bold">Keterlambatan / Ket</th>
                                        <th className="px-6 py-4 font-bold">Manipulasi Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center p-10 text-muted-foreground">Tidak temukan data untuk filter ini.</td>
                                        </tr>
                                    ) : paginatedData.map((att: any) => {
                                        const isAbsenMode = ['alfa','sakit','izin','cuti'].includes(att.status);
                                        return (
                                            <tr key={att.id} className={cn("bg-white border-b transition-colors", isAbsenMode ? "bg-red-50/20" : "")}>
                                                <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-50">
                                                    <div>{format(new Date(att.date), 'dd MMM yyyy', {locale: idLocale})}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase">{format(new Date(att.date), 'iiii', {locale: idLocale})}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-blue-700 text-sm">{att.employee_name}</div>
                                                    <div className="text-xs text-gray-500 font-mono mt-0.5">{att.employee_nip}</div>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    {isAbsenMode ? <span className="text-muted-foreground">-</span> : <span className="font-bold text-emerald-600 font-mono">{att.clock_in ?? '-'}</span>}
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    {isAbsenMode ? <span className="text-muted-foreground">-</span> : <span className="font-bold text-blue-600 font-mono">{att.clock_out ?? '?'}</span>}
                                                </td>
                                                <td className="px-6 py-3">
                                                    {att.late_minutes > 0 ? (
                                                        <span className="text-orange-600 font-bold bg-orange-50 px-2.5 py-1 rounded-md text-[11px] inline-flex items-center gap-1.5 border border-orange-100 uppercase">
                                                            Telat {att.late_minutes} Menit
                                                        </span>
                                                    ) : (
                                                        isAbsenMode ? <span className="text-gray-400 italic text-xs">Kosong</span> : <span className="text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-md text-[11px] inline-flex items-center gap-1.5 border border-emerald-100 uppercase">Tepat Waktu</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 border-l border-gray-50">
                                                    <select 
                                                        className={cn(
                                                            "h-8 rounded-lg border text-xs font-bold px-2 py-1 focus:ring-2 focus:ring-primary outline-none transition-all",
                                                            att.status === 'present' ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                                                            att.status === 'late' ? "border-orange-200 text-orange-700 bg-orange-50" :
                                                            att.status === 'alfa' ? "border-red-200 text-red-700 bg-red-50" :
                                                            "border-blue-200 text-blue-700 bg-blue-50"
                                                        )}
                                                        value={att.status}
                                                        onChange={(e) => updateStatus(att.employee_id, att.date, e.target.value)}
                                                    >
                                                        <option value="present">HADIR</option>
                                                        <option value="late">TELAT</option>
                                                        <option value="alfa">ALFA</option>
                                                        <option value="sakit">SAKIT</option>
                                                        <option value="izin">IZIN</option>
                                                        <option value="cuti">CUTI</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination Footer */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                                <span className="text-sm text-gray-500">
                                    Halaman <span className="font-bold text-gray-900">{currentPage}</span> dari <span className="font-bold text-gray-900">{totalPages}</span> 
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">{attendances.length} Baris Total</span>
                                </span>
                                <div className="flex gap-2 text-sm">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                    >
                                        Sebelumnya
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                    >
                                        Selanjutnya
                                    </Button>
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
