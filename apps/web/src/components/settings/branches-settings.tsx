import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Plus, Edit, Trash2, Store } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

interface Branch {
    id: string;
    name: string;
    address: string;
    phone: string;
    isMain: boolean;
}

export function BranchesSettings() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [formData, setFormData] = useState({ name: '', address: '', phone: '', isMain: false });
    const token = useAuthStore((state) => state.token);

    const fetchBranches = async () => {
        try {
            const response = await api.get('/branches');
            setBranches(response.data);
        } catch (error) {
            console.error('Failed to fetch branches', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchBranches();
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingBranch) {
                await api.patch(`/branches/${editingBranch.id}`, formData);
            } else {
                await api.post('/branches', formData);
            }
            setShowModal(false);
            setEditingBranch(null);
            setFormData({ name: '', address: '', phone: '', isMain: false });
            fetchBranches();
        } catch (error) {
            console.error('Failed to save branch', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this branch?')) return;
        try {
            await api.delete(`/branches/${id}`);
            fetchBranches();
        } catch (error) {
            console.error('Failed to delete branch', error);
        }
    };

    const openModal = (branch?: Branch) => {
        if (branch) {
            setEditingBranch(branch);
            setFormData({
                name: branch.name,
                address: branch.address || '',
                phone: branch.phone || '',
                isMain: branch.isMain
            });
        } else {
            setEditingBranch(null);
            setFormData({ name: '', address: '', phone: '', isMain: false });
        }
        setShowModal(true);
    };

    if (loading) return <div>Loading branches...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Branch Management</h2>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus size={18} /> Add Branch
                </button>
            </div>

            <div className="grid gap-4">
                {branches.map((branch) => (
                    <div key={branch.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white rounded-lg border">
                                <Store className="text-primary" size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                    {branch.name}
                                    {branch.isMain && (
                                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Main</span>
                                    )}
                                </h3>
                                <p className="text-sm text-gray-500">{branch.address}</p>
                                {branch.phone && <p className="text-sm text-gray-500">{branch.phone}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => openModal(branch)}
                                className="p-2 text-gray-500 hover:text-primary hover:bg-white rounded-lg transition-all"
                            >
                                <Edit size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(branch.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isMain"
                                    checked={formData.isMain}
                                    onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="isMain" className="text-sm font-medium text-gray-700">Set as Main Branch</label>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                >
                                    {editingBranch ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
