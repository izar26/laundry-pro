<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TrackingController extends Controller
{
    public function show($invoice)
    {
        $transaction = Transaction::where('invoice_code', $invoice)
            ->with(['details'])
            ->firstOrFail();

        // Tentukan langkah progress
        $steps = [
            ['status' => 'new', 'label' => 'Diterima', 'desc' => 'Cucian diterima oleh kasir.'],
            ['status' => 'process', 'label' => 'Sedang Diproses', 'desc' => 'Sedang dicuci, dikeringkan, dan disetrika.'],
            ['status' => 'ready', 'label' => 'Siap Diambil', 'desc' => 'Cucian sudah wangi dan rapi.'],
            ['status' => 'done', 'label' => 'Selesai', 'desc' => 'Cucian telah diambil pelanggan.'],
        ];

        // Cari index status saat ini
        $currentIndex = array_search($transaction->status, array_column($steps, 'status'));

        return Inertia::render('Tracking/Show', [
            'transaction' => $transaction,
            'steps' => $steps,
            'currentStepIndex' => $currentIndex,
        ]);
    }
}