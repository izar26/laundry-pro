<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'app_name' => 'required|string|max:255',
            'app_phone' => 'required|string|max:20',
            'app_address' => 'required|string',
            'app_logo' => 'nullable|image|max:2048', // Max 2MB
        ]);

        // Update Teks
        Setting::updateOrCreate(['key' => 'app_name'], ['value' => $validated['app_name']]);
        Setting::updateOrCreate(['key' => 'app_phone'], ['value' => $validated['app_phone']]);
        Setting::updateOrCreate(['key' => 'app_address'], ['value' => $validated['app_address']]);

        // Upload Logo
        if ($request->hasFile('app_logo')) {
            // Hapus logo lama jika ada
            $oldLogo = Setting::find('app_logo');
            if ($oldLogo && $oldLogo->value) {
                Storage::disk('public')->delete($oldLogo->value);
            }

            $path = $request->file('app_logo')->store('logos', 'public');
            Setting::updateOrCreate(['key' => 'app_logo'], ['value' => $path]);
        }

        return redirect()->back()->with('message', 'Pengaturan aplikasi diperbarui.');
    }
}