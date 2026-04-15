<?php

namespace App\Http\Controllers;

use App\Models\Promotion;
use App\Models\Service;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class PromotionController extends Controller
{
    public function index(Request $request)
    {
        $query = Promotion::with('service'); // Load relasi service

        if ($request->has('search')) {
            $query->where('name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%");
        }

        $promotions = $query->latest()->paginate(10)->withQueryString();

        $user = auth()->user();
        $canManagePromotions = $user->hasRole(['admin']); // Owner hanya read-only

        return Inertia::render('Admin/Promotions/Index', [
            'promotions' => $promotions,
            'services' => Service::all(), // Kirim daftar layanan untuk pilihan di form
            'filters' => $request->only(['search']),
            'canManagePromotions' => $canManagePromotions,
        ]);
    }

    public function store(Request $request)
    {
        \Log::info('=== PROMO STORE REQUEST ===', $request->all());

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'nullable|string|max:50|unique:promotions',
                'service_id' => 'nullable|exists:services,id',
                'type' => 'required|in:percentage,fixed',
                'value' => 'required|numeric|min:0',
                'min_weight' => 'nullable|numeric|min:0',
                'min_amount' => 'nullable|numeric|min:0',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'description' => 'nullable|string',
                'is_active' => 'boolean',
                'quota' => 'nullable|integer|min:1',
            ]);

            \Log::info('=== PROMO VALIDATED ===', $validated);

            Promotion::create($validated);

            return redirect()->back()->with('message', 'Promosi berhasil dibuat.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('=== PROMO VALIDATION FAILED ===', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            \Log::error('=== PROMO STORE ERROR ===', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            throw $e;
        }
    }

    public function update(Request $request, Promotion $promotion)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => ['nullable', 'string', 'max:50', Rule::unique('promotions')->ignore($promotion->id)],
            'service_id' => 'nullable|exists:services,id',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_weight' => 'nullable|numeric|min:0',
            'min_amount' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'quota' => 'nullable|integer|min:1',
        ]);

        $promotion->update($validated);

        return redirect()->back()->with('message', 'Promosi berhasil diperbarui.');
    }

    public function destroy(Promotion $promotion)
    {
        $promotion->delete();
        return redirect()->back()->with('message', 'Promosi dihapus.');
    }
}
