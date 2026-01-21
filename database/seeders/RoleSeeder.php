<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Roles
        $roles = [
            'admin',
            'owner',
            'pegawai',
            'pelanggan',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }

        // Create Users and Assign Roles
        
        // Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@laundry.test'],
            [
                'name' => 'Admin Sistem',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $admin->assignRole('admin');

        // Owner
        $owner = User::firstOrCreate(
            ['email' => 'owner@laundry.test'],
            [
                'name' => 'Pemilik Laundry',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $owner->assignRole('owner');

        // Pegawai
        $pegawai = User::firstOrCreate(
            ['email' => 'pegawai@laundry.test'],
            [
                'name' => 'Staff Pegawai',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $pegawai->assignRole('pegawai');

        // Pelanggan
        $pelanggan = User::firstOrCreate(
            ['email' => 'pelanggan@laundry.test'],
            [
                'name' => 'Pelanggan Setia',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $pelanggan->assignRole('pelanggan');
    }
}