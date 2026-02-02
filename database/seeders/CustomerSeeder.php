<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Customer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('id_ID'); // Locale Indonesia

        // Buat 20 Pelanggan (User + Customer)
        for ($i = 0; $i < 20; $i++) {
            $user = User::create([
                'name' => $faker->name,
                'email' => $faker->unique()->email,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]);
            
            $user->assignRole('pelanggan');

            Customer::create([
                'user_id' => $user->id,
                'phone' => $faker->phoneNumber, 
                'address' => $faker->address,
                'points' => rand(0, 500),
                'member_level' => 'Regular',
            ]);
        }
    }
}