<?php

namespace Database\Seeders;

use App\Models\Promotion;
use App\Models\Service;
use Illuminate\Database\Seeder;

class PromotionSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil beberapa layanan untuk contoh promo spesifik
        $cuciSepatu = Service::where('name', 'like', '%Sepatu%')->first();
        $bedCover = Service::where('name', 'like', '%Bed Cover%')->first();

        $promotions = [
            [
                'name' => 'Diskon Kiloan Hemat (>10kg)',
                'code' => null, // Otomatis
                'service_id' => null, // Semua layanan (tapi logika controller hanya hitung yang unit kg)
                'type' => 'percentage',
                'value' => 10,
                'min_weight' => 10,
                'min_amount' => null,
                'description' => 'Otomatis diskon 10% jika berat total item KG lebih dari 10kg.',
                'is_active' => true,
            ],
            [
                'name' => 'Spesial Cuci Sepatu',
                'code' => 'HEBATSNEAKERS',
                'service_id' => $cuciSepatu ? $cuciSepatu->id : null, // Hanya untuk Cuci Sepatu
                'type' => 'fixed',
                'value' => 10000,
                'min_weight' => null,
                'min_amount' => null,
                'description' => 'Potongan 10rb khusus layanan Cuci Sepatu.',
                'is_active' => true,
            ],
            [
                'name' => 'Promo Bed Cover Besar',
                'code' => null,
                'service_id' => $bedCover ? $bedCover->id : null,
                'type' => 'percentage',
                'value' => 15,
                'min_weight' => null,
                'min_amount' => null,
                'description' => 'Diskon otomatis 15% khusus Cuci Bed Cover.',
                'is_active' => true,
            ],
            [
                'name' => 'Voucher Member Baru',
                'code' => 'MEMBERBARU',
                'service_id' => null, // Semua layanan
                'type' => 'fixed',
                'value' => 5000,
                'min_weight' => null,
                'min_amount' => 30000,
                'description' => 'Potongan 5rb untuk transaksi minimal 30rb.',
                'is_active' => true,
            ],
        ];

        foreach ($promotions as $promo) {
            Promotion::create($promo);
        }
    }
}
