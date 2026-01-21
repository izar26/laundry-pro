<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $employees = [
            ['name' => 'Budi Santoso', 'email' => 'budi@laundry.test'],
            ['name' => 'Siti Aminah', 'email' => 'siti@laundry.test'],
            ['name' => 'Joko Anwar', 'email' => 'joko@laundry.test'],
        ];

        foreach ($employees as $emp) {
            $user = User::create([
                'name' => $emp['name'],
                'email' => $emp['email'],
                'password' => Hash::make('password'), // Password default
                'email_verified_at' => now(),
            ]);
            
            $user->assignRole('pegawai');
        }
    }
}