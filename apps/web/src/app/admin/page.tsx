'use client';

import React, { useEffect, useState } from 'react';
import { Users, Store, DollarSign, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import toast from 'react-hot-toast';

interface DashboardStats {
    totalTenants: number;
    activeUsers: number;
    totalRevenue: string; // Returning as string/number depending on DB, but likely number. Let's format it.
    systemHealth: number;
    recentTenants: any[];
}

export default function AdminDashboardPage() {
    const token = useAuthStore((state) => state.token);
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        if (token) {
            fetch('http://localhost:3001/tenants/dashboard-stats', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch stats');
                    return res.json();
                })
                .then(data => setStats(data))
                .catch(err => {
                    console.error(err);
                    toast.error('Failed to load dashboard stats');
                });
        }
    }, [token]);

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(Number(amount));
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard title="Total Tenants" value={stats?.totalTenants.toString() || '...'} icon={<Store className="text-blue-500" />} />
                <StatsCard title="Active Users" value={stats?.activeUsers.toString() || '...'} icon={<Users className="text-green-500" />} />
                <StatsCard title="Total Revenue" value={stats ? formatCurrency(stats.totalRevenue) : '...'} icon={<DollarSign className="text-yellow-500" />} />
                <StatsCard title="System Health" value={stats ? `${stats.systemHealth}%` : '...'} icon={<Activity className="text-purple-500" />} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Tenants</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="pb-3 font-medium text-gray-500">Name</th>
                                <th className="pb-3 font-medium text-gray-500">Address</th>
                                <th className="pb-3 font-medium text-gray-500">Phone</th>
                                <th className="pb-3 font-medium text-gray-500">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {stats?.recentTenants.map((tenant: any) => (
                                <tr key={tenant.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 text-gray-800 font-medium">{tenant.name}</td>
                                    <td className="py-3 text-gray-600">{tenant.address || '-'}</td>
                                    <td className="py-3 text-gray-600">{tenant.phone || '-'}</td>
                                    <td className="py-3 text-gray-500">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {!stats && [1, 2, 3].map(i => (
                                <tr key={i} className="animate-pulse">
                                    <td className="py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                    <td className="py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                    <td className="py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                    <td className="py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

function StatsCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
                {icon}
            </div>
        </div>
    );
}
