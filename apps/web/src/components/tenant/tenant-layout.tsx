'use client';

import React from 'react';
import { LayoutDashboard, ShoppingBag, Utensils, Users, Settings, LogOut, Armchair } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/store/auth-store';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    role: string;
    branchName?: string;
}

export function TenantLayout({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((state) => state.token);
    const setToken = useAuthStore((state) => state.setToken);
    const router = useRouter();
    let role = '';
    let branchName = '';

    if (token) {
        try {
            const decoded: DecodedToken = jwtDecode(token);
            role = decoded.role;
            branchName = decoded.branchName || '';
        } catch (e) {
            console.error('Invalid token');
        }
    }

    const handleLogout = () => {
        setToken('');
        router.push('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-primary">My Restaurant</h1>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 text-primary font-medium">
                        <LayoutDashboard size={20} />
                        <span>Overview</span>
                    </Link>
                    <Link href="/pos" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                        <ShoppingBag size={20} />
                        <span>POS System</span>
                    </Link>
                    <Link href="/dashboard/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                        <Utensils size={20} />
                        <span>Orders</span>
                    </Link>
                    {(role === 'admin' || role === 'manager') && (
                        <>
                            <Link href="/dashboard/menu" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                                <Utensils size={20} />
                                <span>Menu</span>
                            </Link>
                            <Link href="/dashboard/customers" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                                <Users size={20} />
                                <span className="font-medium">Customers</span>
                            </Link>
                        </>
                    )}
                    {role === 'admin' && (
                        <>
                            <Link href="/dashboard/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                                <Users size={20} />
                                <span>Staff</span>
                            </Link>
                            <Link href="/dashboard/tables" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                                <Armchair size={20} />
                                <span>Tables</span>
                            </Link>
                            <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                                <Settings size={20} />
                                <span>Settings</span>
                            </Link>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white shadow-sm border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <span className="block text-sm font-medium text-gray-900 capitalize">{role || 'User'}</span>
                            {branchName && (
                                <span className="block text-xs text-gray-500">{branchName}</span>
                            )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                            {(role?.[0] || 'U').toUpperCase()}
                        </div>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
