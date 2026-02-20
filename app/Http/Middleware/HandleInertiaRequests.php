<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Ambil settings sekali saja (ideally cache it)
        $appSettings = Setting::all()->pluck('value', 'key');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'phone' => $request->user()->employee?->phone ?? $request->user()->customer?->phone,
                    'address' => $request->user()->employee?->address ?? $request->user()->customer?->address,
                    'avatar' => $request->user()->avatar,
                    'roles' => $request->user()->getRoleNames(),
                ] : null,
            ],
            'midtrans_client_key' => config('services.midtrans.client_key'),
            'midtrans_is_production' => filter_var(config('services.midtrans.is_production'), FILTER_VALIDATE_BOOLEAN),
            'app_settings' => $appSettings,
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
                'timestamp' => time(),
            ],
        ];
    }
}