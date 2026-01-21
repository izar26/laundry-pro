<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        // Hanya ambil user dengan role 'pegawai'
        $query = User::role('pegawai');

        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        $employees = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/Employees/Index', [
            'employees' => $employees,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(), // Auto verify agar bisa login
        ]);

        $user->assignRole('pegawai');

        return redirect()->back()->with('message', 'Pegawai berhasil ditambahkan.');
    }

    public function update(Request $request, User $employee)
    {
        // Validasi, password opsional saat update
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($employee->id)],
            'password' => 'nullable|string|min:8',
        ]);

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($validated['password']);
        }

        $employee->update($data);

        return redirect()->back()->with('message', 'Data pegawai diperbarui.');
    }

    public function destroy(User $employee)
    {
        if ($employee->hasRole('admin')) {
             return redirect()->back()->withErrors(['message' => 'Tidak bisa menghapus admin utama.']);
        }
        
        $employee->delete();

        return redirect()->back()->with('message', 'Pegawai dihapus.');
    }
}