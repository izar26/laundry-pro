<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        // Ambil data dari tabel employees beserta relasi user dan roles
        $query = Employee::with(['user.roles']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })->orWhere('nip', 'like', "%{$search}%");
        }

        // Urutkan: Owner -> Administrator -> Lainnya -> Terbaru
        $employees = $query->orderByRaw("
            CASE 
                WHEN position = 'Owner' THEN 1 
                WHEN position = 'Administrator' THEN 2 
                ELSE 3 
            END ASC
        ")->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/Employees/Index', [
            'employees' => $employees,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // Data User
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            // Data Employee
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'nip' => 'nullable|string|max:20|unique:employees',
            'position' => 'nullable|string|max:50',
            'salary' => 'nullable|numeric|min:0',
            'join_date' => 'nullable|date',
        ]);

        DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'avatar' => null, // Default
                'email_verified_at' => now(),
            ]);

            $user->assignRole('pegawai');

            Employee::create([
                'user_id' => $user->id,
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'nip' => $validated['nip'],
                'position' => $validated['position'] ?? 'Staff',
                'salary' => $validated['salary'] ?? 0,
                'join_date' => $validated['join_date'] ?? now(),
            ]);
        });

        return redirect()->back()->with('message', 'Pegawai berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $employee = Employee::with('user')->findOrFail($id);
        $user = $employee->user;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'nip' => ['nullable', 'string', Rule::unique('employees')->ignore($employee->id)],
            'position' => 'nullable|string|max:50',
            'salary' => 'nullable|numeric|min:0',
            'join_date' => 'nullable|date',
        ]);

        DB::transaction(function () use ($user, $employee, $validated, $request) {
            // Update User
            $userData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
            ];
            if ($request->filled('password')) {
                $userData['password'] = Hash::make($validated['password']);
            }
            $user->update($userData);

            // Update Employee
            $employee->update([
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'nip' => $validated['nip'],
                'position' => $validated['position'],
                'salary' => $validated['salary'],
                'join_date' => $validated['join_date'],
            ]);
        });

        return redirect()->back()->with('message', 'Data pegawai diperbarui.');
    }

    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        $user = $employee->user;

        if ($user->hasRole('admin')) {
             return redirect()->back()->withErrors(['message' => 'Tidak bisa menghapus admin utama.']);
        }
        
        $user->delete(); // Ini akan men-trigger delete cascade ke employees

        return redirect()->back()->with('message', 'Pegawai dihapus.');
    }
}