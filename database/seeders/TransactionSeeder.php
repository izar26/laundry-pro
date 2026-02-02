<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\Customer;
use App\Models\User;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Support\Str;

class TransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Pastikan ada data customer, user, dan service
        $customers = Customer::all();
        $services = Service::all();
        // Ambil user yang boleh input (Admin/Pegawai) untuk field user_id (kasir)
        // Atau ambil sembarang user jika logicnya bebas
        $cashiers = User::role(['admin', 'pegawai', 'owner'])->get();

        if ($customers->count() == 0 || $services->count() == 0 || $cashiers->count() == 0) {
            $this->command->info('Data Customer, Service, atau User (Pegawai/Admin) kosong. Jalankan seeder lain dulu.');
            return;
        }

        $totalTransactions = 2000;

        for ($i = 0; $i < $totalTransactions; $i++) {
            // Random Tanggal (1 Tahun Terakhir)
            $date = Carbon::now()->subDays(rand(0, 365))->setTime(rand(7, 20), rand(0, 59));
            
            // Random Customer & Kasir
            $customer = $customers->random();
            $cashier = $cashiers->random();

            // Random Status
            $statuses = ['new', 'process', 'process', 'ready', 'done', 'done', 'done', 'cancelled']; // Bobot 'done' lebih besar
            $status = $statuses[array_rand($statuses)];
            
            // Payment Status
            $paymentStatus = 'unpaid';
            if (in_array($status, ['done', 'cancelled']) || rand(0, 1)) {
                $paymentStatus = 'paid'; // Done/Cancel biasanya lunas, atau random
            }
            if ($status === 'cancelled') $paymentStatus = 'cancelled';

            // Generate Details (1-3 items per transaksi)
            $itemCount = rand(1, 3);
            $totalAmount = 0;
            $items = [];

            for ($j = 0; $j < $itemCount; $j++) {
                $service = $services->random();
                $qty = ($service->unit === 'kg') ? rand(1, 10) : rand(1, 5); // Kg bisa koma sebenernya, tapi int aja biar simpel
                $subtotal = $service->price * $qty;
                
                $items[] = [
                    'service_id' => $service->id,
                    'service_name' => $service->name,
                    'qty' => $qty,
                    'price' => $service->price,
                    'subtotal' => $subtotal,
                ];
                $totalAmount += $subtotal;
            }

            // Diskon (10% chance dapet diskon random)
            $discount = 0;
            if (rand(1, 10) == 1) {
                $discount = rand(5000, 20000);
                if ($discount > $totalAmount) $discount = $totalAmount / 2;
            }

            $finalAmount = $totalAmount - $discount;

            // Buat Transaksi
            $transaction = Transaction::create([
                'invoice_code' => 'TRX-' . $date->format('Ymd') . '-' . strtoupper(Str::random(4)),
                'customer_id' => $customer->id,
                'user_id' => $cashier->id,
                'total_amount' => $totalAmount,
                'discount_amount' => $discount,
                'final_amount' => $finalAmount,
                'payment_method' => rand(0, 1) ? 'cash' : 'midtrans',
                'payment_status' => $paymentStatus,
                'status' => $status,
                'created_at' => $date,
                'updated_at' => $date,
            ]);

            // Buat Details
            foreach ($items as $item) {
                TransactionDetail::create([
                    'transaction_id' => $transaction->id,
                    'service_id' => $item['service_id'],
                    'service_name' => $item['service_name'],
                    'qty' => $item['qty'],
                    'price' => $item['price'],
                    'subtotal' => $item['subtotal'],
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);
            }
        }
    }
}