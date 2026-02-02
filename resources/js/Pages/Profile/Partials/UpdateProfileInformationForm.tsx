import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import InputError from '@/Components/InputError';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { FormEventHandler } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';

interface UpdateProfileForm {
    _method: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    avatar: File | null;
}

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user;

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm<UpdateProfileForm>({
            _method: 'PATCH',
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            address: user.address || '',
            avatar: null,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('profile.update'));
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-6">
                
                {/* Avatar Upload */}
                <div className="space-y-2">
                    <Label htmlFor="avatar">Foto Profil</Label>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Avatar className="h-20 w-20 border-2 border-border">
                            <AvatarImage 
                                src={data.avatar ? URL.createObjectURL(data.avatar) : (user.avatar ? `/storage/${user.avatar}` : `https://ui-avatars.com/api/?name=${user.name}&background=random`)} 
                                className="object-cover"
                            />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Input 
                                id="avatar" 
                                type="file" 
                                onChange={(e) => setData('avatar', e.target.files ? e.target.files[0] : null)}
                                accept="image/*"
                                className="cursor-pointer"
                            />
                            <p className="text-[10px] text-muted-foreground">Format: JPG, PNG, max 2MB.</p>
                        </div>
                    </div>
                    <InputError className="mt-2" message={errors.avatar} />
                </div>

                {/* Nama & Email Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input
                            id="name"
                            className="mt-1 block w-full bg-background"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoFocus
                            autoComplete="name"
                        />
                        <InputError className="mt-2" message={errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            className="mt-1 block w-full bg-background"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                        />
                        <InputError className="mt-2" message={errors.email} />
                    </div>
                </div>

                {/* No HP & Alamat */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="phone">Nomor HP / WhatsApp</Label>
                        <Input
                            id="phone"
                            type="text"
                            className="mt-1 block w-full bg-background md:w-1/2"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="0812xxxx"
                        />
                        <InputError className="mt-2" message={errors.phone} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Alamat Lengkap</Label>
                        <Textarea
                            id="address"
                            className="mt-1 block w-full bg-background min-h-[100px]"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            placeholder="Jl. Mawar No. 12..."
                        />
                        <InputError className="mt-2" message={errors.address} />
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Email Anda belum terverifikasi.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Klik di sini untuk kirim ulang email verifikasi.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                Link verifikasi baru telah dikirim ke email Anda.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <Button disabled={processing}>Simpan Perubahan</Button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-muted-foreground">
                            Tersimpan.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}