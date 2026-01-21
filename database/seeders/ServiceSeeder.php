<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'name' => 'Cuci Komplit (Cuci + Setrika)',
                'price' => 7000,
                'unit' => 'kg',
                'description' => 'Layanan standar bersih, wangi, dan rapi.',
            ],
            [
                'name' => 'Cuci Kering (Lipat)',
                'price' => 5000,
                'unit' => 'kg',
                'description' => 'Cuci bersih dan kering tanpa setrika.',
            ],
            [
                'name' => 'Setrika Saja',
                'price' => 4000,
                'unit' => 'kg',
                'description' => 'Hanya jasa setrika uap.',
            ],
            [
                'name' => 'Cuci Bed Cover (Kecil)',
                'price' => 20000,
                'unit' => 'pcs',
                'description' => 'Ukuran Single/Twin.',
            ],
            [
                'name' => 'Cuci Bed Cover (Besar)',
                'price' => 30000,
                'unit' => 'pcs',
                'description' => 'Ukuran Queen/King.',
            ],
            [
                'name' => 'Cuci Sepatu (Deep Clean)',
                'price' => 35000,
                'unit' => 'pcs',
                'description' => 'Pembersihan mendalam untuk semua jenis sepatu.',
            ],
            [
                'name' => 'Cuci Karpet',
                'price' => 15000,
                'unit' => 'meter',
                'description' => 'Harga per meter persegi.',
            ],
            [
                'name' => 'Express 4 Jam',
                'price' => 12000,
                'unit' => 'kg',
                'description' => 'Layanan kilat prioritas tinggi.',
            ],
        ];

        foreach ($services as $service) {
            Service::create($service);
        }
    }
}