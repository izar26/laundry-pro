<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        @php
            $appSettings = $page['props']['app_settings'] ?? [];
            $appName = $appSettings['app_name'] ?? config('app.name', 'Laundry Pro');
            $appLogo = $appSettings['app_logo'] ?? null;
            $faviconUrl = $appLogo ? asset('storage/' . $appLogo) : '/favicon.svg';
        @endphp
        <title inertia>{{ $appName }}</title>
        <link rel="icon" href="{{ $faviconUrl }}" />
        <script>
            window.appName = "{{ $appName }}";
        </script>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
