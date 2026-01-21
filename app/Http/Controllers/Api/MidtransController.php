<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransController extends Controller
{
    public function callback(Request $request)
    {
        // 1. Ambil data notifikasi
        $notification = $request->all();
        
        // Log untuk debugging (opsional, bisa dimatikan di production)
        Log::info('Midtrans Notification:', $notification);

        $status = $notification['transaction_status'];
        $type = $notification['payment_type'];
        $orderId = $notification['order_id'];
        $fraud = $notification['fraud_status'];

        // 2. Cari Transaksi
        $transaction = Transaction::where('invoice_code', $orderId)->first();

        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        // 3. Verifikasi Signature Key (Security)
        // Rumus: SHA512(order_id+status_code+gross_amount+ServerKey)
        $serverKey = config('services.midtrans.server_key');
        $signatureKey = $notification['signature_key'];
        
        // Pastikan format gross_amount sama persis (termasuk .00 jika ada)
        // Midtrans mengirim string, jadi kita concat langsung stringnya.
        // Namun, hati-hati jika midtrans kirim 10000.00 dan di DB kita 10000.
        // Lebih aman hitung signature lokal menggunakan data dari payload
        
        $mySignature = hash('sha512', 
            $notification['order_id'] . 
            $notification['status_code'] . 
            $notification['gross_amount'] . 
            $serverKey
        );

        if ($signatureKey !== $mySignature) {
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        // 4. Update Status Transaksi
        if ($status == 'capture') {
            if ($type == 'credit_card') {
                if ($fraud == 'challenge') {
                    $transaction->update(['payment_status' => 'unpaid']); // Pending challenge
                } else {
                    $transaction->update(['payment_status' => 'paid']);
                }
            }
        } else if ($status == 'settlement') {
            $transaction->update(['payment_status' => 'paid']);
        } else if ($status == 'pending') {
            $transaction->update(['payment_status' => 'unpaid']);
        } else if ($status == 'deny') {
            $transaction->update(['payment_status' => 'cancelled']);
        } else if ($status == 'expire') {
            $transaction->update(['payment_status' => 'expired']);
        } else if ($status == 'cancel') {
            $transaction->update(['payment_status' => 'cancelled']);
        }

        return response()->json(['message' => 'Notification processed']);
    }
}