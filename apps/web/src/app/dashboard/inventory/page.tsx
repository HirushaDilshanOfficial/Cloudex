'use client';

import React, { useState, useEffect } from 'react';
import { TenantLayout } from '@/components/tenant/tenant-layout';
import { Plus, Search, AlertTriangle, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

interface Ingredient {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
    costPerUnit: number;
    branch?: {
        id: string;
        name: string;
    };
}

interface Branch {
    id: string;
    name: string;
}

interface DecodedToken {
    tenantId: string;
}

export default function InventoryPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const token = useAuthStore((state) => state.token);

    const [branches, setBranches] = useState<Branch[]>([]);
    const [tenantId, setTenantId] = useState<string>('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBranch, setFilterBranch] = useState('all');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

    // Form Data
    const [formData, setFormData] = useState({ name: '', unit: 'kg', costPerUnit: 0, currentStock: 0, branchId: '' });
    const [adjustData, setAdjustData] = useState({ quantity: 0, type: 'IN', reason: '' });

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
        if (token && tenantId) {
            fetchIngredients();
            fetchBranches();
        }
    }, [token, tenantId]);

    const fetchIngredients = async () => {
        try {
            const response = await api.get(`/inventory/ingredients?tenantId=${tenantId}`);
            setIngredients(response.data);
        } catch (error) {
            console.error('Failed to fetch ingredients', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await api.get(`/branches?tenantId=${tenantId}`);
            setBranches(response.data);
        } catch (error) {
            console.error('Failed to fetch branches', error);
        }
    };

    const handleSave = async () => {
        try {
            if (editingIngredient) {
                await api.patch(`/inventory/ingredients/${editingIngredient.id}`, formData);
                toast.success('Ingredient updated successfully');
            } else {
                await api.post('/inventory/ingredients', {
                    ...formData,
                    tenantId,
                });
                toast.success('Ingredient created successfully');
            }
            setShowModal(false);
            setEditingIngredient(null);
            setFormData({ name: '', unit: 'kg', costPerUnit: 0, currentStock: 0, branchId: '' });
            fetchIngredients();
        } catch (error) {
            console.error('Failed to save ingredient', error);
            toast.error('Failed to save ingredient');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ingredient?')) return;
        try {
            await api.delete(`/inventory/ingredients/${id}`);
            toast.success('Ingredient deleted successfully');
            fetchIngredients();
        } catch (error) {
            console.error('Failed to delete ingredient', error);
            toast.error('Failed to delete ingredient');
        }
    };

    const handleAdjustStock = async () => {
        if (!selectedIngredient) return;
        try {
            await api.post('/inventory/stock', {
                ingredientId: selectedIngredient.id,
                quantity: adjustData.quantity,
                type: adjustData.type,
                reason: adjustData.reason || 'Manual adjustment',
                tenantId,
            });
            toast.success('Stock adjusted successfully');
            setShowAdjustModal(false);
            setSelectedIngredient(null);
            setAdjustData({ quantity: 0, type: 'IN', reason: '' });
            fetchIngredients();
        } catch (error) {
            console.error('Failed to adjust stock', error);
            toast.error('Failed to adjust stock');
        }
    };

    const openEditModal = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
        setFormData({
            name: ingredient.name,
            unit: ingredient.unit,
            costPerUnit: ingredient.costPerUnit,
            currentStock: ingredient.currentStock,
            branchId: ingredient.branch?.id || '',
        });
        setShowModal(true);
    };

    const openAdjustModal = (ingredient: Ingredient) => {
        setSelectedIngredient(ingredient);
        setAdjustData({ quantity: 0, type: 'IN', reason: '' });
        setShowAdjustModal(true);
    };

    const filteredIngredients = ingredients.filter(ingredient => {
        const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBranch = filterBranch === 'all' || ingredient.branch?.id === filterBranch;
        return matchesSearch && matchesBranch;
    });

    return (
        <TenantLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
                    <p className="text-gray-500">Manage your ingredients and stock levels</p>
                </div>
                <button
                    onClick={() => {
                        setEditingIngredient(null);
                        setFormData({ name: '', unit: 'kg', costPerUnit: 0, currentStock: 0, branchId: '' });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Ingredient</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search ingredients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <select
                        value={filterBranch}
                        onChange={(e) => setFilterBranch(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                    >
                        <option value="all">All Branches</option>
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500">Name</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Current Stock</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Unit</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Cost/Unit</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Branch</th>
                                <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredIngredients.map((ingredient) => (
                                <tr key={ingredient.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{ingredient.name}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{ingredient.currentStock}</td>
                                    <td className="px-6 py-4 text-gray-500">{ingredient.unit}</td>
                                    <td className="px-6 py-4 text-gray-500">${ingredient.costPerUnit}</td>
                                    <td className="px-6 py-4">
                                        {ingredient.currentStock < 10 ? (
                                            <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full w-fit">
                                                <AlertTriangle size={12} /> Low Stock
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">In Stock</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {ingredient.branch?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openAdjustModal(ingredient)}
                                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors text-xs font-medium border border-blue-200"
                                            >
                                                Adjust
                                            </button>
                                            <button
                                                onClick={() => openEditModal(ingredient)}
                                                className="text-gray-400 hover:text-blue-500 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ingredient.id)}
                                                className="text-gray-400 hover:text-red-500 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredIngredients.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No ingredients found. Add some to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="l">l</option>
                                        <option value="ml">ml</option>
                                        <option value="pcs">pcs</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost/Unit</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.costPerUnit}
                                        onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            {!editingIngredient && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.currentStock}
                                        onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) })}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                <select
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.branchId}
                                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                                >
                                    <option value="">Select Branch (Optional)</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                            >
                                {editingIngredient ? 'Save Changes' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Adjust Stock Modal */}
            {showAdjustModal && selectedIngredient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Adjust Stock: {selectedIngredient.name}</h2>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setAdjustData({ ...adjustData, type: 'IN' })}
                                    className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 ${adjustData.type === 'IN' ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <ArrowUpCircle size={20} /> Stock In
                                </button>
                                <button
                                    onClick={() => setAdjustData({ ...adjustData, type: 'OUT' })}
                                    className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 ${adjustData.type === 'OUT' ? 'bg-red-50 border-red-200 text-red-700' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <ArrowDownCircle size={20} /> Stock Out
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity ({selectedIngredient.unit})</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-lg"
                                    value={adjustData.quantity}
                                    onChange={(e) => setAdjustData({ ...adjustData, quantity: parseFloat(e.target.value) })}
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="e.g. Purchase, Spoilage, Correction"
                                    value={adjustData.reason}
                                    onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowAdjustModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdjustStock}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                            >
                                Confirm Adjustment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
