'use client';

import React, { useEffect } from 'react';
import { LayoutDashboard, Users, Store, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    role: string;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((state) => state.token);
    const setToken = useAuthStore((state) => state.setToken);
    const router = useRouter();
    const [mounted, setMounted] = React.useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!token) {
            router.push('/login');
            return;
        }
        try {
            const decoded: DecodedToken = jwtDecode(token);
            if (decoded.role !== 'super_admin') {
                router.push('/dashboard'); // Redirect unauthorized users
            }
        } catch (e) {
            router.push('/login');
        }
    }, [token, router]);

    const handleLogout = () => {
        setToken('');
        router.push('/login');
    };

    if (!mounted) return null;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold tracking-tight">Cloudex Admin</h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 text-white">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link href="/admin/tenants" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
                        <Store size={20} />
                        <span>Tenants</span>
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
                        <Users size={20} />
                        <span>Users</span>
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
                        <Settings size={20} />
                        <span>Settings</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white shadow-sm border-b border-gray-200 p-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Overview</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Super Admin</span>
                        <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
