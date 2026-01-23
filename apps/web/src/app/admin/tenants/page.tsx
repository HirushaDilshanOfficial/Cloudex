'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Store, Calendar, Activity, Search } from 'lucide-react';
import Link from 'next/link';

interface Tenant {
    id: string;
    name: string;
    domain: string;
    createdAt: string;
    isActive: boolean;
}

import api from '@/lib/api';

// ...

export default function TenantsPage() {
    const token = useAuthStore((state) => state.token);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api.get('/tenants')
                .then(res => {
                    const data = res.data;
                    // Start of Selection
                    if (Array.isArray(data)) {
                        setTenants(data);
                    } else {
                        console.error('Expected array of tenants, got:', data);
                        setTenants([]);
                    }
                    // End of Selection
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [token]);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Tenants</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search tenants..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-medium text-gray-500">Name</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Domain</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Joined</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tenants.map(tenant => (
                            <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Store size={20} />
                                        </div>
                                        <span className="font-medium text-gray-900">{tenant.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{tenant.domain}</td>
                                <td className="px-6 py-4 text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        <span>{new Date(tenant.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                        <Activity size={12} />
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <Link
                                        href={`/admin/tenants/${tenant.id}`}
                                        className="text-slate-600 hover:text-slate-900 font-medium text-sm no-underline"
                                    >
                                        Manage
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
