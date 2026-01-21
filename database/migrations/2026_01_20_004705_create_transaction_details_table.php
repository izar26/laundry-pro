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
        Schema::create('transaction_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained()->onDelete('cascade');
            
            // Jika layanan dihapus, riwayat transaksi jangan hilang. 
            // Kita set null on delete, tapi kita simpan nama layanan di kolom terpisah atau biarkan relation (biasanya soft delete di service lebih baik).
            // Untuk simpel, kita cascade delete jika transaksi dihapus, tapi jika service dihapus, kita pakai null.
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();
            
            $table->string('service_name'); // Simpan nama layanan saat transaksi (snapshot)
            $table->decimal('qty', 8, 2); // Berat/Jumlah
            $table->decimal('price', 12, 2); // Harga satuan saat itu
            $table->decimal('subtotal', 12, 2); // qty * price
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction_details');
    }
};