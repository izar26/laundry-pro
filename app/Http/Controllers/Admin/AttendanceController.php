<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use Inertia\Inertia;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\Setting;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function scanner()
    {
        $timeIn = Setting::where('key', 'attendance_time_in')->first()->value ?? '08:00:00';
        $timeOut = Setting::where('key', 'attendance_time_out')->first()->value ?? '17:00:00';

        return Inertia::render('Admin/Attendances/Scanner', [
            'pagetitle' => 'Scanner Absensi Karyawan',
            'timeIn' => $timeIn,
            'timeOut' => $timeOut,
        ]);
    }

    public function record(Request $request)
    {
        $request->validate([
            'qr_token' => 'required|string'
        ]);

        $employee = Employee::with('user')->where('qr_token', $request->qr_token)->first();

        if (!$employee) {
            return response()->json(['message' => 'QR Code tidak valid atau Pegawai tidak ditemukan.'], 404);
        }

        $today = Carbon::today()->toDateString();
        $currentTime = Carbon::now()->toTimeString();

        // Check if there is already an attendance today
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if (!$attendance) {
            // Clock IN
            $timeInSetting = Setting::where('key', 'attendance_time_in')->first()->value ?? '08:00:00';
            
            $timeInExpected = Carbon::createFromTimeString($timeInSetting);
            $timeInActual = Carbon::now();
            
            $lateMinutes = 0;
            $status = 'present';
            
            if ($timeInActual->greaterThan($timeInExpected)) {
                $lateMinutes = $timeInActual->diffInMinutes($timeInExpected);
                $status = 'late';
            }

            Attendance::create([
                'employee_id' => $employee->id,
                'date' => $today,
                'clock_in' => $currentTime,
                'status' => $status,
                'late_minutes' => $lateMinutes
            ]);

            return response()->json([
                'message' => "Berhasil Absen Masuk: {$employee->user->name}",
                'type' => 'in',
                'employee' => $employee->user->name,
                'time' => $currentTime,
                'late_minutes' => $lateMinutes
            ]);
        } 
        
        if (!$attendance->clock_out) {
            // Clock OUT
            $attendance->update([
                'clock_out' => $currentTime
            ]);

            return response()->json([
                'message' => "Berhasil Absen Pulang: {$employee->user->name}",
                'type' => 'out',
                'employee' => $employee->user->name,
                'time' => $currentTime
            ]);
        }

        return response()->json([
            'message' => "Pegawai {$employee->user->name} sudah absen masuk dan pulang hari ini.",
            'type' => 'done'
        ], 400);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'status' => 'required|string',
        ]);

        $attendance = Attendance::updateOrCreate(
            [
                'employee_id' => $request->employee_id,
                'date' => $request->date,
            ],
            [
                'status' => $request->status,
                'late_minutes' => $request->status === 'late' ? 1 : 0 
            ]
        );

        return response()->json([
            'message' => 'Status berhasil diperbarui',
            'attendance' => $attendance
        ]);
    }

    public function index(Request $request)
    {
        $startDateStr = $request->query('start_date', Carbon::today()->format('Y-m-d'));
        $endDateStr = $request->query('end_date', Carbon::today()->format('Y-m-d'));
        $employeeId = $request->query('employee_id', 'all');
        $statusFilter = $request->query('status', 'all');

        $startDate = Carbon::parse($startDateStr);
        $endDate = Carbon::parse($endDateStr);
        
        // Prevent massive looping memory exhaust
        if ($startDate->diffInDays($endDate) > 31) {
            $endDate = $startDate->copy()->addDays(31);
        }

        // 1. Get employees (Exclude Admins and Owners)
        $employeesQuery = Employee::with('user')->whereNotIn('position', ['Owner', 'Administrator', 'owner', 'admin']);
        
        if ($employeeId && $employeeId !== 'all') {
            $employeesQuery->where('id', $employeeId);
        }
        $employeesObj = $employeesQuery->get();

        // 2. Get existing attendances
        $attendances = Attendance::whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
                    ->get()
                    ->groupBy(function($att) {
                        return $att->date . '_' . $att->employee_id;
                    });

        // 3. Generate Cartesian Product
        $results = [];
        for ($d = $startDate->copy(); $d->lte($endDate); $d->addDay()) {
            $dateStr = $d->format('Y-m-d');
            foreach ($employeesObj as $emp) {
                $key = $dateStr . '_' . $emp->id;
                $attendanceRecord = $attendances->get($key) ? $attendances->get($key)->first() : null;

                $currentStatus = $attendanceRecord ? $attendanceRecord->status : 'alfa';

                // Filter by status if not "all"
                if ($statusFilter !== 'all' && $currentStatus !== $statusFilter) {
                    continue;
                }

                $results[] = [
                    'id' => $attendanceRecord ? $attendanceRecord->id : 'new_'.$key, // dummy id to map in react
                    'employee_id' => $emp->id,
                    'date' => $dateStr,
                    'clock_in' => $attendanceRecord ? $attendanceRecord->clock_in : null,
                    'clock_out' => $attendanceRecord ? $attendanceRecord->clock_out : null,
                    'status' => $currentStatus,
                    'late_minutes' => $attendanceRecord ? $attendanceRecord->late_minutes : 0,
                    'employee_name' => $emp->user->name ?? 'Unknown',
                    'employee_nip' => $emp->nip ?? '-'
                ];
            }
        }
        
        // Return JSON format if requested via XHR
        if ($request->wantsJson()) {
            // Reversed array agar tanggal terbaru di atas
            return response()->json([
                'attendances' => array_reverse($results)
            ]);
        }

        // Return regular Employee list for filters
        $allEmployees = Employee::with('user')->whereNotIn('position', ['Owner', 'Administrator', 'owner', 'admin'])->get()->map(function($emp) {
            return [
                'id' => $emp->id,
                'name' => $emp->user->name ?? 'Unknown',
                'nip' => $emp->nip ?? '-'
            ];
        });

        return Inertia::render('Admin/Attendances/Index', [
            'attendances' => array_reverse($results),
            'employees' => $allEmployees,
            'filters' => [
                'start_date' => $startDateStr,
                'end_date' => $endDateStr,
                'employee_id' => $employeeId,
                'status' => $statusFilter,
            ]
        ]);
    }

    public function export(Request $request)
    {
        $startDate = $request->query('start_date', Carbon::today()->format('Y-m-d'));
        $endDate = $request->query('end_date', Carbon::today()->format('Y-m-d'));
        $employeeId = $request->query('employee_id', 'all');
        $status = $request->query('status', 'all');

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\AttendancesExport($startDate, $endDate, $employeeId, $status), 
            "laporan-absensi-$startDate-to-$endDate.xlsx"
        );
    }
}
