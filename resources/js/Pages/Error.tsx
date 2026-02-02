import { Head, Link } from '@inertiajs/react';
import BackgroundParticles from '@/Components/BackgroundParticles';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import { AlertTriangle, FileQuestion, Lock, ArrowLeft, Ban } from 'lucide-react';

interface Props {
    status: number;
    message?: string;
}

export default function Error({ status, message }: Props) {
    const title = {
        503: 'Layanan Tidak Tersedia',
        500: 'Kesalahan Server',
        404: 'Halaman Tidak Ditemukan',
        403: 'Akses Ditolak',
    }[status] || 'Terjadi Kesalahan';

    const description = {
        503: 'Maaf, kami sedang melakukan pemeliharaan. Silakan cek kembali nanti.',
        500: 'Maaf, terjadi kesalahan di server kami.',
        404: 'Maaf, halaman yang Anda cari tidak dapat ditemukan.',
        403: message || 'Maaf, Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi atasan jika ini kesalahan.',
    }[status] || 'Maaf, terjadi kesalahan yang tidak terduga.';

    const Icon = {
        503: AlertTriangle,
        500: AlertTriangle,
        404: FileQuestion,
        403: Ban,
    }[status] || AlertTriangle;

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 text-foreground selection:bg-primary selection:text-white">
            <Head title={title} />
            <BackgroundParticles />
            
            <Card className="z-10 w-full max-w-md border-muted/40 shadow-2xl backdrop-blur-sm bg-card/80 animate-in fade-in zoom-in duration-300">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
                        <Icon className="h-12 w-12 text-destructive" strokeWidth={1.5} />
                    </div>
                    <CardTitle className="text-4xl font-black tracking-tighter sm:text-5xl text-primary">
                        {status}
                    </CardTitle>
                    <h2 className="text-xl font-bold uppercase tracking-widest text-muted-foreground mt-2">
                        {title}
                    </h2>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground pb-6">
                    <p className="leading-relaxed">{description}</p>
                </CardContent>
                <CardFooter className="flex justify-center pb-8">
                    <Button asChild className="gap-2 shadow-lg hover:shadow-primary/25" size="lg" variant="default">
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Dashboard
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
