<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE attendances MODIFY COLUMN status VARCHAR(255) DEFAULT 'present'");
    }

    public function down(): void
    {
        // it is hard to revert back to ENUM safely if there are unknown status entries
        DB::statement("ALTER TABLE attendances MODIFY COLUMN status VARCHAR(255) DEFAULT 'present'");
    }
};