<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_code')->unique(); // TRX-20240120-0001
            
            // Relasi
            $table->foreignId('customer_id')->constrained('users')->onDelete('cascade'); // Pelanggan (User)
            $table->foreignId('user_id')->constrained(); // Siapa yang input (Pegawai/Admin)
            
            // Keuangan
            $table->decimal('total_amount', 12, 2); // Total Harga Layanan
            $table->decimal('discount_amount', 12, 2)->default(0); // Total Diskon
            $table->decimal('final_amount', 12, 2); // Yang harus dibayar
            
            // Pembayaran
            $table->string('payment_method')->nullable(); // 'cash', 'midtrans'
            $table->enum('payment_status', ['unpaid', 'paid', 'expired', 'cancelled'])->default('unpaid');
            $table->string('snap_token')->nullable(); // Token dari Midtrans
            
            // Status Laundry
            $table->enum('status', ['new', 'process', 'ready', 'done'])->default('new');
            // new: Baru masuk
            // process: Sedang dicuci/setrika
            // ready: Siap diambil
            // done: Sudah diambil
            
            $table->text('notes')->nullable(); // Catatan tambahan
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};