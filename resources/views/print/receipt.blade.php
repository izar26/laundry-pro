<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Struk Laundry - {{ $transaction->invoice_code }}</title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            margin: 0;
            padding: 0;
            width: 58mm; /* Ukuran standar printer thermal */
            color: #000;
        }
        .container {
            padding: 5px 10px;
        }
        .header {
            text-align: center;
            margin-bottom: 10px;
        }
        .header h2 {
            margin: 0;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header p {
            margin: 2px 0;
            font-size: 10px;
            line-height: 1.2;
        }
        .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
        }
        .info {
            font-size: 11px;
            margin-bottom: 5px;
        }
        .info div {
            display: flex;
            justify-content: space-between;
        }
        .items {
            width: 100%;
        }
        .item {
            margin-bottom: 5px;
        }
        .item-main {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
        }
        .item-sub {
            font-size: 10px;
            color: #333;
        }
        .total-section {
            margin-top: 5px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
        }
        .final-total {
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
            border-top: 1px solid #000;
            padding-top: 5px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
        }
        .qr-section {
            margin-top: 15px;
            text-align: center;
        }
        @media print {
            body { width: 58mm; }
            @page { margin: 0; }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="container">
        <div class="header">
            <h2>{{ $settings['app_name'] ?? 'LAUNDRY PRO' }}</h2>
            <p>{{ $settings['app_address'] ?? 'Alamat Belum Diatur' }}</p>
            <p>Telp: {{ $settings['app_phone'] ?? '-' }}</p>
        </div>

        <div class="divider"></div>

        <div className="info">
            <div><span>No:</span> <span>{{ $transaction->invoice_code }}</span></div>
            <div><span>Tgl:</span> <span>{{ $transaction->created_at->format('d/m/Y H:i') }}</span></div>
            <div><span>Plg:</span> <span>{{ $transaction->customer->user->name }}</span></div>
            <div><span>Ksr:</span> <span>{{ $transaction->user->name }}</span></div>
        </div>

        <div class="divider"></div>

        <div class="items">
            @foreach($transaction->details as $detail)
            <div class="item">
                <div class="item-main">
                    <span>{{ $detail->service_name }}</span>
                    <span>{{ number_format($detail->subtotal, 0, ',', '.') }}</span>
                </div>
                <div class="item-sub">
                    {{ (float)$detail->qty }} x {{ number_format($detail->price, 0, ',', '.') }}
                </div>
            </div>
            @endforeach
        </div>

        <div class="divider"></div>

        <div class="total-section">
            <div class="total-row">
                <span>Subtotal</span>
                <span>{{ number_format($transaction->total_amount, 0, ',', '.') }}</span>
            </div>
            @if($transaction->discount_amount > 0)
            <div class="total-row">
                <span>Diskon</span>
                <span>-{{ number_format($transaction->discount_amount, 0, ',', '.') }}</span>
            </div>
            @endif
            <div class="total-row final-total">
                <span>TOTAL BAYAR</span>
                <span>{{ number_format($transaction->final_amount, 0, ',', '.') }}</span>
            </div>
        </div>

        <div class="footer">
            <p>*** TERIMA KASIH ***</p>
            <p>Cek Status Cucian:</p>
            <div class="qr-section">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data={{ route('tracking.show', $transaction->invoice_code) }}" width="80">
                <p style="font-size: 8px; word-break: break-all; margin-top: 5px;">{{ route('tracking.show', $transaction->invoice_code) }}</p>
            </div>
            <p style="margin-top: 15px;">Pakaian tidak diambil > 30 hari<br>di luar tanggung jawab kami.</p>
        </div>
    </div>
</body>
</html>
