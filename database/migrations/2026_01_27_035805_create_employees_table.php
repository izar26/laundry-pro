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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Link ke User
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('nip')->nullable()->unique(); // Nomor Induk Pegawai
            $table->string('position')->default('Staff'); // Jabatan
            $table->decimal('salary', 12, 2)->default(0); // Gaji
            $table->date('join_date')->nullable(); // Tanggal Masuk
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
