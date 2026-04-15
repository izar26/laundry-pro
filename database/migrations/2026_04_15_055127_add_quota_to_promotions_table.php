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
        Schema::table('promotions', function (Blueprint $table) {
            $table->integer('quota')->nullable()->after('value')->comment('Limit penggunaan. Null jika tanpa limit.');
            $table->integer('used_count')->default(0)->after('quota')->comment('Berapa kali promo ini telah dipakai.');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->dropColumn(['quota', 'used_count']);
        });
    }
};
