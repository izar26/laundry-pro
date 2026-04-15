<?php

namespace App\Console;

use App\Models\Employee;
use Illuminate\Support\Str;

Employee::whereNull('qr_token')->get()->each(function($emp) {
    if (empty($emp->qr_token)) {
        $emp->update(['qr_token' => (string) Str::uuid()]);
        echo "Updated: " . $emp->id . PHP_EOL;
    }
});

echo "Patch complete." . PHP_EOL;
