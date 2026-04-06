<?php

namespace App\Exports;

use App\Models\Attendance;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AttendancesExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    protected $startDate;
    protected $endDate;
    protected $employeeId;
    protected $status;

    public function __construct($startDate, $endDate, $employeeId = null, $status = null)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->employeeId = $employeeId;
        $this->status = $status;
    }

    public function collection()
    {
        $startDate = \Illuminate\Support\Carbon::parse($this->startDate);
        $endDate = \Illuminate\Support\Carbon::parse($this->endDate);

        $employeesQuery = \App\Models\Employee::with('user')->whereNotIn('position', ['Owner', 'Administrator', 'owner', 'admin']);
        
        if ($this->employeeId && $this->employeeId !== 'all') {
            $employeesQuery->where('id', $this->employeeId);
        }
        $employeesObj = $employeesQuery->get();

        $attendances = Attendance::whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
                    ->get()
                    ->groupBy(function($att) {
                        return $att->date . '_' . $att->employee_id;
                    });

        $results = [];
        for ($d = $startDate->copy(); $d->lte($endDate); $d->addDay()) {
            $dateStr = $d->format('Y-m-d');
            foreach ($employeesObj as $emp) {
                $key = $dateStr . '_' . $emp->id;
                $attendanceRecord = $attendances->get($key) ? $attendances->get($key)->first() : null;

                $currentStatus = $attendanceRecord ? $attendanceRecord->status : 'alfa';

                if ($this->status && $this->status !== 'all' && $currentStatus !== $this->status) {
                    continue;
                }

                $results[] = [
                    'date' => $dateStr,
                    'employee_name' => $emp->user->name ?? 'Unknown',
                    'employee_nip' => $emp->nip ?? '-',
                    'clock_in' => $attendanceRecord ? ($attendanceRecord->clock_in ?? '-') : '-',
                    'clock_out' => $attendanceRecord ? ($attendanceRecord->clock_out ?? '-') : '-',
                    'late_minutes' => ($attendanceRecord && $attendanceRecord->late_minutes > 0) ? $attendanceRecord->late_minutes . ' Menit' : '-',
                    'status' => ucfirst($currentStatus),
                ];
            }
        }

        return collect(array_reverse($results));
    }

    public function map($row): array
    {
        return [
            $row['date'],
            $row['employee_name'],
            $row['employee_nip'],
            $row['clock_in'],
            $row['clock_out'],
            $row['late_minutes'],
            $row['status'],
        ];
    }

    public function headings(): array
    {
        $employeeName = 'Semua Pegawai';
        if ($this->employeeId && $this->employeeId !== 'all') {
            $emp = \App\Models\Employee::with('user')->find($this->employeeId);
            if ($emp && $emp->user) {
                $employeeName = $emp->user->name;
            }
        }

        $statusName = 'Semua Status';
        if ($this->status && $this->status !== 'all') {
            $statusName = ucfirst($this->status);
        }

        $startDateStr = \Illuminate\Support\Carbon::parse($this->startDate)->format('d M Y');
        $endDateStr = \Illuminate\Support\Carbon::parse($this->endDate)->format('d M Y');

        return [
            ['LAPORAN ABSENSI PEGAWAI'],
            ['Rentang Tanggal', ': ' . $startDateStr . ' s/d ' . $endDateStr],
            ['Filter Pegawai', ': ' . $employeeName],
            ['Filter Status', ': ' . $statusName],
            [''],
            [
                'Tanggal',
                'Nama Pegawai',
                'NIP',
                'Jam Masuk',
                'Jam Pulang',
                'Keterlambatan',
                'Status',
            ]
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->mergeCells('A1:G1');
        return [
            1 => ['font' => ['bold' => true, 'size' => 14]],
            2 => ['font' => ['bold' => true]],
            3 => ['font' => ['bold' => true]],
            4 => ['font' => ['bold' => true]],
            6 => ['font' => ['bold' => true], 'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['rgb' => 'E2E8F0']]],
        ];
    }
}
