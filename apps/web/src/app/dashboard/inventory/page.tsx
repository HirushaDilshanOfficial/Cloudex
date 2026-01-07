'use client';

import React, { useState, useEffect } from 'react';
import { TenantLayout } from '@/components/tenant/tenant-layout';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';

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

export default function InventoryPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const token = useAuthStore((state) => state.token);

    const [branches, setBranches] = useState<Branch[]>([]);
    const [tenantId, setTenantId] = useState<string>('');

    useEffect(() => {
        if (token) {
            try {
                const decoded: any = JSON.parse(atob(token.split('.')[1]));
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
            const response = await axios.get(`http://localhost:3001/inventory/ingredients?tenantId=${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIngredients(response.data);
        } catch (error) {
            console.error('Failed to fetch ingredients', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/branches?tenantId=${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranches(response.data);
        } catch (error) {
            console.error('Failed to fetch branches', error);
        }
    };

    const [showModal, setShowModal] = useState(false);
    const [newIngredient, setNewIngredient] = useState({ name: '', unit: 'kg', costPerUnit: 0, currentStock: 0, branchId: '' });

    const handleCreate = async () => {
        try {
            await axios.post('http://localhost:3001/inventory/ingredients', {
                ...newIngredient,
                tenantId,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            fetchIngredients();
        } catch (error) {
            console.error('Failed to create ingredient', error);
        }
    };

    return (
        <TenantLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
                    <p className="text-gray-500">Manage your ingredients and stock levels</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Ingredient</span>
                </button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New Ingredient</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={newIngredient.name}
                                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={newIngredient.unit}
                                        onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
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
                                        value={newIngredient.costPerUnit}
                                        onChange={(e) => setNewIngredient({ ...newIngredient, costPerUnit: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-lg"
                                    value={newIngredient.currentStock}
                                    onChange={(e) => setNewIngredient({ ...newIngredient, currentStock: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                <select
                                    className="w-full p-2 border rounded-lg"
                                    value={newIngredient.branchId}
                                    onChange={(e) => setNewIngredient({ ...newIngredient, branchId: e.target.value })}
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
                                onClick={handleCreate}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search ingredients..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500">Name</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Current Stock</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Unit</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Cost/Unit</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Branch</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {ingredients.map((ingredient) => (
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
                                <td className="px-6 py-4">
                                    <button className="text-primary hover:underline text-sm font-medium">Adjust</button>
                                </td>
                            </tr>
                        ))}
                        {ingredients.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No ingredients found. Add some to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </TenantLayout>
    );
}
