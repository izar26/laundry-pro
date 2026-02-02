<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            EmployeeSeeder::class,
            ServiceSeeder::class,
            PromotionSeeder::class,
            CustomerSeeder::class,
            SettingSeeder::class, // Tambahkan Setting jika belum
            TransactionSeeder::class, // Seeder Transaksi di akhir
        ]);
    }
}
