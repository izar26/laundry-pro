<?php

namespace Database\Seeders;

use App\Models\Employee;
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
            $user = User::firstOrCreate(
                ['email' => $emp['email']],
                [
                    'name' => $emp['name'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );
            $user->assignRole('pegawai');

            Employee::create([
                'user_id' => $user->id,
                'phone' => '0812' . rand(10000000, 99999999),
                'address' => 'Jl. Contoh Pegawai No. ' . rand(1, 100),
                'nip' => 'EMP-' . rand(1000, 9999),
                'position' => 'Staff',
                'salary' => 3500000,
                'join_date' => now(),
            ]);
        }

        // Factory untuk data dummy tambahan
        User::factory(10)->create()->each(function ($user) {
            $user->assignRole('pegawai');
            Employee::create([
                'user_id' => $user->id,
                'phone' => fake()->phoneNumber(),
                'address' => fake()->address(),
                'nip' => 'EMP-' . rand(10000, 99999),
                'position' => 'Staff',
                'salary' => rand(3000000, 5000000),
                'join_date' => now()->subDays(rand(1, 365)),
            ]);
        });
    }
}