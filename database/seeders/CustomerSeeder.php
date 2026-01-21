<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('id_ID'); // Locale Indonesia

        // Buat 20 Pelanggan
        for ($i = 0; $i < 20; $i++) {
            Customer::create([
                'name' => $faker->name,
                'phone' => $faker->phoneNumber, // Contoh: 081xxxx
                'email' => $faker->email,
                'address' => $faker->address,
            ]);
        }
    }
}