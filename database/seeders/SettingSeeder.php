<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'app_name' => 'Laundry Pro',
            'app_phone' => '0812-3456-7890',
            'app_address' => 'Jl. Merdeka No. 45, Jakarta Selatan',
            'app_logo' => null, // Path logo nanti
        ];

        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}