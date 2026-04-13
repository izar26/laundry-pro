<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QueueController extends Controller
{
    public function index()
    {
        $mapTransaction = function ($transaction) {
            return [
                'id' => $transaction->id,
                'invoice_code' => $transaction->invoice_code,
                'customer' => $transaction->customer ? [
                    'name' => optional($transaction->customer->user)->name ?? 'Pelanggan'
                ] : null,
            ];
        };

        $processing = Transaction::where('status', 'process')
            ->with(['customer.user'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map($mapTransaction);

        $ready = Transaction::where('status', 'ready')
            ->with(['customer.user'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map($mapTransaction);

        return Inertia::render('Queue/Index', [
            'processing' => $processing,
            'ready' => $ready,
        ]);
    }
}