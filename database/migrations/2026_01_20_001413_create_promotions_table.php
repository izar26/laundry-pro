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
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nama Promo: "Diskon Kiloan", "Promo Merdeka"
            $table->string('code')->nullable()->unique(); // Kode Voucher (Opsional)
            $table->text('description')->nullable();
            
            // Tipe dan Nilai
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('value', 10, 2); // 10% atau 5000
            
            // Syarat (Conditions)
            $table->decimal('min_weight', 8, 2)->nullable(); // Minimal Berat (Kg)
            $table->decimal('min_amount', 12, 2)->nullable(); // Minimal Transaksi (Rp)
            
            // Periode & Status
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};