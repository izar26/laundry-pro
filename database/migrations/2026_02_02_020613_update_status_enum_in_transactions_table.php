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
        // Menggunakan raw statement karena mengubah enum di Laravel terkadang bermasalah dengan Doctrine
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE transactions MODIFY COLUMN status ENUM('pending', 'new', 'process', 'ready', 'done', 'cancelled') NOT NULL DEFAULT 'new'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Kembalikan ke enum semula
        // Note: Jika ada data 'pending' atau 'cancelled', ini akan error atau dikonversi ke string kosong/index error tergantung mode SQL.
        // Sebaiknya update data dulu sebelum revert jika di production.
        \Illuminate\Support\Facades\DB::statement("UPDATE transactions SET status = 'new' WHERE status IN ('pending', 'cancelled')");
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE transactions MODIFY COLUMN status ENUM('new', 'process', 'ready', 'done') NOT NULL DEFAULT 'new'");
    }
};
