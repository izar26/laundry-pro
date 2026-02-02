<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TrackingController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\DashboardController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Route Pelacakan Publik (Tanpa Login)
Route::get('/track/{invoice}', [TrackingController::class, 'show'])->name('tracking.show');
Route::get('/queue', [QueueController::class, 'index'])->name('queue.index');

Route::middleware('auth')->group(function () {
    // --- Rute yang bisa diakses SEMUA User yang Login (Termasuk Pegawai & Pelanggan) ---
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Transaksi Create/Store (Admin, Pegawai, Pelanggan) - OWNER TIDAK BOLEH
    Route::group(['middleware' => ['role:admin|pegawai|pelanggan']], function () {
        Route::get('/transactions/create', [TransactionController::class, 'create'])->name('transactions.create');
        Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');
        
        // Cancel khusus pelanggan (hanya bisa jika pending)
        Route::patch('/transactions/{transaction}/cancel', [TransactionController::class, 'cancel'])->name('transactions.cancel');
    });

    // Layanan & Promo (Read Only untuk Pegawai & Pelanggan)
    Route::group(['middleware' => ['role:admin|owner|pegawai|pelanggan']], function () {
        Route::get('/services', [ServiceController::class, 'index'])->name('services.index');
        Route::get('/promotions', [PromotionController::class, 'index'])->name('promotions.index');
        
        // Transaksi Read Only (Index/Show) - Owner Boleh Lihat
        Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
        Route::get('/transactions/{transaction}', [TransactionController::class, 'show'])->name('transactions.show');
        
        // Midtrans Callback/Check (Perlu akses publik/user terkait)
        Route::get('/transactions/{transaction}/check-status', [TransactionController::class, 'checkStatus'])->name('transactions.check-status');
    });

    // Transaksi Lanjutan & Manajemen (Pegawai, Admin, Owner)
    Route::group(['middleware' => ['role:admin|owner|pegawai']], function () {
        // Edit/Update/Destroy Transaksi
        Route::get('/transactions/{transaction}/edit', [TransactionController::class, 'edit'])->name('transactions.edit');
        Route::put('/transactions/{transaction}', [TransactionController::class, 'update'])->name('transactions.update');
        Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy'])->name('transactions.destroy');
        
        Route::post('/transactions/{transaction}/paid', [TransactionController::class, 'markAsPaid'])->name('transactions.paid');
        Route::patch('/transactions/{transaction}/status', [TransactionController::class, 'updateStatus'])->name('transactions.status');
        Route::get('/transactions/{transaction}/print', [TransactionController::class, 'print'])->name('transactions.print');

        // Customer Read (Index/Show) - Semua bisa lihat
        Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
        Route::get('/customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
        
        // Laporan (Read Only)
        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/export', [ReportController::class, 'export'])->name('reports.export');
        
        // Settings (Read Only View)
        Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');

        // Pegawai (Read Only untuk Owner & Admin)
        Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
    });

    // --- Rute Write/Modify Khusus Admin & Pegawai (Owner excluded from operational writes) ---
    Route::group(['middleware' => ['role:admin|pegawai']], function () {
        // Manajemen Customer (Create/Edit/Delete)
        Route::get('/customers/create', [CustomerController::class, 'create'])->name('customers.create');
        Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
        Route::get('/customers/{customer}/edit', [CustomerController::class, 'edit'])->name('customers.edit');
        Route::put('/customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
        Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
    });

    // --- Rute KHUSUS ADMIN ---
    Route::group(['middleware' => ['role:admin']], function () {
        // Manajemen Pegawai (Create/Edit/Delete) - Index sudah di atas
        Route::get('/employees/create', [EmployeeController::class, 'create'])->name('employees.create');
        Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
        Route::get('/employees/{employee}/edit', [EmployeeController::class, 'edit'])->name('employees.edit');
        Route::put('/employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
        Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
        
        // Services & Promotions (Write)
        Route::resource('services', ServiceController::class)->except(['index']);
        Route::resource('promotions', PromotionController::class)->except(['index']);
        
        // Settings (Update)
        Route::post('/settings', [SettingController::class, 'update'])->name('settings.update');
    });
});

require __DIR__.'/auth.php';
