<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Employee;
use App\Models\Customer;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
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

        // 1. Create Permissions
        $permissions = [
            'view dashboard',
            'manage employees', // Create, Edit, Delete Pegawai
            'manage services',  // Create, Edit, Delete Layanan
            'manage promotions',// Create, Edit, Delete Promo
            'manage customers', // Create, Edit, Delete Pelanggan
            'manage transactions', // Create, Process Transaksi
            'view reports',     // Lihat Laporan Keuangan
            'manage settings',  // Ubah Pengaturan Aplikasi
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // 2. Create Roles
        $roles = [
            'admin',
            'owner',
            'pegawai',
            'pelanggan',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }

        // 3. Assign Permissions to Roles

        // Admin & Owner: Full Access
        $adminRole = Role::findByName('admin');
        $ownerRole = Role::findByName('owner');
        $adminRole->givePermissionTo(Permission::all());
        $ownerRole->givePermissionTo(Permission::all());

        // Pegawai: Operational Access Only
        $pegawaiRole = Role::findByName('pegawai');
        $pegawaiRole->givePermissionTo([
            'view dashboard',
            'manage customers',
            'manage transactions',
        ]);

        // Pelanggan: Limited Access
        $pelangganRole = Role::findByName('pelanggan');

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
        // Buat Profile Employee untuk Admin
        Employee::firstOrCreate(
            ['user_id' => $admin->id],
            ['position' => 'Administrator', 'join_date' => now()]
        );

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
        // Buat Profile Employee untuk Owner
        Employee::firstOrCreate(
            ['user_id' => $owner->id],
            ['position' => 'Owner', 'join_date' => now()]
        );

        // Pegawai Dummy (Default)
        $pegawai = User::firstOrCreate(
            ['email' => 'pegawai@laundry.test'],
            [
                'name' => 'Staff Pegawai',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $pegawai->assignRole('pegawai');
        Employee::firstOrCreate(
            ['user_id' => $pegawai->id],
            ['position' => 'Staff', 'join_date' => now()]
        );

        // Pelanggan Dummy (Default)
        $pelanggan = User::firstOrCreate(
            ['email' => 'pelanggan@laundry.test'],
            [
                'name' => 'Pelanggan Setia',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $pelanggan->assignRole('pelanggan');
        Customer::firstOrCreate(
            ['user_id' => $pelanggan->id],
            ['member_level' => 'Silver', 'points' => 100]
        );
    }
}