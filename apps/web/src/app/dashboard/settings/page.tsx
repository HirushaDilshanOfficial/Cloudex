'use client';

import React, { useEffect, useState } from 'react';
import { TenantLayout } from '@/components/tenant/tenant-layout';
import { useAuthStore } from '@/store/auth-store';
import axios from 'axios';
import { Save, Building, DollarSign, Printer, Store } from 'lucide-react';
import { BranchesSettings } from '@/components/settings/branches-settings';
import { jwtDecode } from 'jwt-decode';

interface TenantSettings {
    id: string;
    name: string;
    address: string;
    phone: string;
    currency: string;
    taxName: string;
    taxRate: number;
}

interface DecodedToken {
    tenantId: string;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState<TenantSettings>({
        id: '',
        name: '',
        address: '',
        phone: '',
        currency: 'USD',
        taxName: 'Tax',
        taxRate: 0,
    });
    const [printerIp, setPrinterIp] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const token = useAuthStore((state) => state.token);
    const [tenantId, setTenantId] = useState<string>('');

    useEffect(() => {
        if (token) {
            try {
                const decoded: DecodedToken = jwtDecode(token);
                setTenantId(decoded.tenantId);
            } catch (error) {
                console.error('Invalid token', error);
            }
        }
    }, [token]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/tenants/${tenantId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSettings(response.data);

                // Load printer IP from local storage
                const savedPrinterIp = localStorage.getItem('printerIp');
                if (savedPrinterIp) setPrinterIp(savedPrinterIp);
            } catch (error) {
                console.error('Failed to fetch settings', error);
            } finally {
                setLoading(false);
            }
        };

        if (token && tenantId) {
            fetchSettings();
        }
    }, [token, tenantId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // Save backend settings
            await axios.put(`http://localhost:3001/tenants/${tenantId}`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Save local settings
            localStorage.setItem('printerIp', printerIp);

            setMessage({ type: 'success', text: 'Settings saved successfully' });
        } catch (error) {
            console.error('Failed to save settings', error);
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <TenantLayout>
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </TenantLayout>
        );
    }

    return (
        <TenantLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                    <p className="text-gray-500">Configure your restaurant and application preferences</p>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'general' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Building size={18} /> General
                        </button>
                        <button
                            onClick={() => setActiveTab('financial')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'financial' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <DollarSign size={18} /> Financial
                        </button>
                        <button
                            onClick={() => setActiveTab('hardware')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'hardware' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Printer size={18} /> Hardware
                        </button>
                        <button
                            onClick={() => setActiveTab('branches')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'branches' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Store size={18} /> Branches
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="p-6">
                        {activeTab === 'general' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                                    <input
                                        type="text"
                                        value={settings.name}
                                        onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        value={settings.address || ''}
                                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={settings.phone || ''}
                                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'financial' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                                    <input
                                        type="text"
                                        value={settings.currency}
                                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="e.g. $, €, £"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax Name</label>
                                        <input
                                            type="text"
                                            value={settings.taxName}
                                            onChange={(e) => setSettings({ ...settings, taxName: e.target.value })}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            placeholder="e.g. VAT, GST"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                                        <input
                                            type="number"
                                            value={settings.taxRate}
                                            onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'hardware' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Printer IP</label>
                                    <input
                                        type="text"
                                        value={printerIp}
                                        onChange={(e) => setPrinterIp(e.target.value)}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="e.g. 192.168.1.200"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        This setting is saved locally on this device.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'branches' && (
                            <BranchesSettings />
                        )}

                        {activeTab !== 'branches' && (
                            <div className="mt-8 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <Save size={20} />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </TenantLayout>
    );
}
