<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::with('user');

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })->orWhere('phone', 'like', "%{$search}%");
        }

        $customers = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/Customers/Index', [
            'customers' => $customers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:users',
            'phone' => 'required|string|max:20', // Phone bisa duplikat di user lain? Sebaiknya unik di customers
            'address' => 'nullable|string',
            'points' => 'nullable|integer|min:0',
            'member_level' => 'nullable|string|in:Regular,Silver,Gold',
        ]);

        DB::transaction(function () use ($validated) {
            // Generate email dummy jika kosong
            $email = $validated['email'] ?? ($validated['phone'] . '@customer.laundry');
            
            // Cek jika email dummy sudah ada (konflik)
            if (User::where('email', $email)->exists()) {
                $email = $validated['phone'] . '.' . Str::random(4) . '@customer.laundry';
            }

            $user = User::create([
                'name' => $validated['name'],
                'email' => $email,
                'password' => Hash::make('password'), // Default password
                'email_verified_at' => now(),
            ]);

            $user->assignRole('pelanggan');

            Customer::create([
                'user_id' => $user->id,
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'points' => $validated['points'] ?? 0,
                'member_level' => $validated['member_level'] ?? 'Regular',
            ]);
        });

        return redirect()->back()->with('message', 'Pelanggan berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::with('user')->findOrFail($id);
        $user = $customer->user;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['nullable', 'email', Rule::unique('users')->ignore($user->id)],
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'points' => 'nullable|integer',
            'member_level' => 'nullable|string',
        ]);

        DB::transaction(function () use ($user, $customer, $validated) {
            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? $user->email, // Jangan ubah email dummy kalau input kosong
            ]);

            $customer->update([
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'points' => $validated['points'],
                'member_level' => $validated['member_level'],
            ]);
        });

        return redirect()->back()->with('message', 'Data pelanggan diperbarui.');
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->user->delete(); // Hapus User (Cascade ke Customer)

        return redirect()->back()->with('message', 'Pelanggan dihapus.');
    }
}