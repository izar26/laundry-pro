<?php

namespace App\Exports;

use App\Models\Transaction;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TransactionsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    protected $startDate;
    protected $endDate;

    public function __construct($startDate, $endDate)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function collection()
    {
        return Transaction::with(['customer', 'user'])
            ->whereBetween('created_at', [$this->startDate . ' 00:00:00', $this->endDate . ' 23:59:59'])
            ->latest()
            ->get();
    }

    public function map($transaction): array
    {
        return [
            $transaction->invoice_code,
            $transaction->created_at->format('d/m/Y H:i'),
            $transaction->customer->name,
            $transaction->user->name,
            number_format($transaction->total_amount, 0, ',', '.'),
            number_format($transaction->discount_amount, 0, ',', '.'),
            number_format($transaction->final_amount, 0, ',', '.'),
            $transaction->payment_method,
            ucfirst($transaction->payment_status),
            ucfirst($transaction->status),
        ];
    }

    public function headings(): array
    {
        return [
            'No Invoice',
            'Tanggal Transaksi',
            'Nama Pelanggan',
            'Kasir',
            'Total Kotor',
            'Diskon',
            'Total Bayar',
            'Metode Bayar',
            'Status Bayar',
            'Status Cucian',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]], // Baris 1 Bold
        ];
    }
}