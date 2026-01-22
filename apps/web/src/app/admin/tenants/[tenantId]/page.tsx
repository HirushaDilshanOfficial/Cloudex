'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Globe, Building } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

interface Tenant {
    id: string;
    name: string;
    domain: string;
    createdAt: string;
    isActive: boolean;
    address?: string;
    phone?: string;
    status: 'ACTIVE' | 'SUSPENDED';
}

export default function TenantDetailPage() {
    const { tenantId } = useParams();
    const authStore = useAuthStore();
    const { token, setToken, setUser } = authStore;
    const router = useRouter();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [impersonating, setImpersonating] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (token && tenantId) {
            fetch(`http://localhost:3001/tenants/${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch tenant');
                    return res.json();
                })
                .then(data => {
                    setTenant(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    toast.error('Could not load tenant details');
                    setLoading(false);
                });
        }
    }, [token, tenantId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant) return;
        setSaving(true);
        try {
            const res = await fetch(`http://localhost:3001/tenants/${tenant.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(tenant)
            });
            if (!res.ok) throw new Error('Failed to update');
            toast.success('Tenant updated successfully');
        } catch (error) {
            toast.error('Failed to update tenant');
        } finally {
            setSaving(false);
        }
    };

    const handleImpersonate = async () => {
        if (!tenant) return;
        setImpersonating(true);
        try {
            const res = await fetch(`http://localhost:3001/auth/impersonate/${tenant.id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to impersonate');

            const data = await res.json();
            setToken(data.access_token);
            setUser(data.user);
            toast.success(`Logged in as Admin for ${tenant.name}`);
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error('Failed to login as tenant admin');
            setImpersonating(false);
        }
    };

    const toggleStatus = () => {
        if (!tenant) return;
        const newStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        setTenant({ ...tenant, status: newStatus });
        // Auto-save logic could go here, but let's stick to the save button or immediate effect
        // Immediate effect implementation:
        fetch(`http://localhost:3001/tenants/${tenant.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        }).then(res => {
            if (!res.ok) toast.error('Failed to update status');
            else toast.success(`Tenant ${newStatus === 'ACTIVE' ? 'Activated' : 'Suspended'}`);
        });
    };

    const confirmDelete = async () => {
        if (!tenant) return;
        try {
            const res = await fetch(`http://localhost:3001/tenants/${tenant.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Tenant deleted successfully');
            router.push('/admin/tenants');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete tenant');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!tenant) return <div className="p-8">Tenant not found</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/tenants" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Manage Tenant</h1>

                <div className="ml-auto flex items-center gap-3">
                    <button
                        onClick={handleImpersonate}
                        disabled={impersonating}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {impersonating ? 'Logging in...' : 'Login as Admin'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Building size={20} className="text-blue-500" />
                            Basic Information
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {tenant.status || 'ACTIVE'}
                            </span>
                            <button
                                type="button"
                                onClick={toggleStatus}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                {tenant.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Tenant Name</label>
                            <input
                                type="text"
                                value={tenant.name || ''}
                                onChange={e => setTenant({ ...tenant, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Domain</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={tenant.domain || ''}
                                    onChange={e => setTenant({ ...tenant, domain: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Address</label>
                            <input
                                type="text"
                                value={tenant.address || ''}
                                onChange={e => setTenant({ ...tenant, address: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Phone</label>
                            <input
                                type="text"
                                value={tenant.phone || ''}
                                onChange={e => setTenant({ ...tenant, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4">
                    <button
                        type="button"
                        className="px-6 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors flex items-center gap-2"
                        onClick={() => setShowDeleteModal(true)}
                    >
                        <Trash2 size={18} />
                        Delete Tenant
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Tenant"
                message={`Are you sure you want to delete "${tenant.name}"? This action cannot be undone and will permanently remove all associated data.`}
                confirmText="Delete Tenant"
                variant="danger"
            />
        </div>
    );
}
