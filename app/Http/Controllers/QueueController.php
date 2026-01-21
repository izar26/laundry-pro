<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QueueController extends Controller
{
    public function index()
    {
        $processing = Transaction::where('status', 'process')
            ->with('customer:id,name')
            ->orderBy('updated_at', 'desc')
            ->get();

        $ready = Transaction::where('status', 'ready')
            ->with('customer:id,name')
            ->orderBy('updated_at', 'desc')
            ->get();

        return Inertia::render('Queue/Index', [
            'processing' => $processing,
            'ready' => $ready,
        ]);
    }
}