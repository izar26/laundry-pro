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
                'status' => $transaction->status,
                'customer' => $transaction->customer ? [
                    'name' => optional($transaction->customer->user)->name ?? 'Pelanggan'
                ] : null,
                'time' => $transaction->updated_at ? $transaction->updated_at->format('H:i') : ''
            ];
        };

        $transactions = Transaction::whereIn('status', ['pending', 'new', 'process', 'ready'])
            ->orWhere(function ($query) {
                $query->whereIn('status', ['done', 'cancelled'])
                      ->whereDate('updated_at', \Carbon\Carbon::today());
            })
            ->with(['customer.user'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map($mapTransaction)
            ->groupBy('status');

        return Inertia::render('Queue/Index', [
            'queue' => [
                'pending' => $transactions->get('pending', []),
                'new' => $transactions->get('new', []),
                'process' => $transactions->get('process', []),
                'ready' => $transactions->get('ready', []),
                'done' => $transactions->get('done', []),
                'cancelled' => $transactions->get('cancelled', []),
            ]
        ]);
    }
}