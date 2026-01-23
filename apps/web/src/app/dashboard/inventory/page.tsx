'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';

import { generateReport } from '@/lib/report-generator';
import { Plus, Search, AlertTriangle, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, CheckCircle, Download, History } from 'lucide-react';

import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

interface Ingredient {
    id: string;
    name: string;
    unit: string;
    costPerUnit: number;
    currentStock: number;
    branchId?: string;
    branch?: {
        id: string;
        name: string;
    };
}

interface Alert {
    id: string;
    ingredient: Ingredient;
    branch: { name: string };
    createdAt: string;
    notes?: string;
}

export default function InventoryPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        unit: 'kg',
        costPerUnit: 0,
        currentStock: 0,
        branchId: '',
    });
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const token = useAuthStore((state) => state.token);
    const [tenantId, setTenantId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBranch, setFilterBranch] = useState('all');
    const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);

    // Adjust Stock State
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
    const [adjustData, setAdjustData] = useState({ type: 'IN', quantity: 0, reason: '' });

    // Delete State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [ingredientToDelete, setIngredientToDelete] = useState<string | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isBranchSpecific, setIsBranchSpecific] = useState(false);

    useEffect(() => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setTenantId(decoded.tenantId);
            } catch (error) {
                console.error('Invalid token', error);
            }
        }
    }, [token]);

    const fetchData = async () => {
        try {
            const [ingredientsRes, branchesRes, alertsRes] = await Promise.all([
                api.get(`/inventory/ingredients?tenantId=${tenantId}`),
                api.get(`/branches`),
                api.get(`/inventory/alerts?tenantId=${tenantId}`),
            ]);
            setIngredients(ingredientsRes.data);
            setBranches(branchesRes.data);
            setAlerts(alertsRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && tenantId) {
            fetchData();
        }
    }, [token, tenantId]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (editingIngredient) {
                await api.patch(`/inventory/ingredients/${editingIngredient.id}`, {
                    ...formData,
                    branchId: isBranchSpecific ? formData.branchId : null,
                });
                toast.success('Ingredient updated successfully');
            } else {
                await api.post(`/inventory/ingredients`, {
                    ...formData,
                    branchId: isBranchSpecific ? formData.branchId : null,
                    tenantId,
                });
                toast.success('Ingredient created successfully');
            }
            setShowModal(false);
            setEditingIngredient(null);
            fetchData();
        } catch (error) {
            console.error('Failed to save ingredient', error);
            toast.error('Failed to save ingredient');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        setIngredientToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!ingredientToDelete) return;
        try {
            await api.delete(`/inventory/ingredients/${ingredientToDelete}`);
            toast.success('Ingredient deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Failed to delete ingredient', error);
            toast.error('Failed to delete ingredient');
        } finally {
            setShowDeleteModal(false);
            setIngredientToDelete(null);
        }
    };

    const openEditModal = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
        setFormData({
            name: ingredient.name,
            unit: ingredient.unit,
            costPerUnit: ingredient.costPerUnit,
            currentStock: ingredient.currentStock,
            branchId: ingredient.branchId || '',
        });
        setIsBranchSpecific(!!ingredient.branchId);
        setShowModal(true);
    };

    const openAdjustModal = (ingredient: Ingredient) => {
        setSelectedIngredient(ingredient);
        setAdjustData({ type: 'IN', quantity: 0, reason: '' });
        setShowAdjustModal(true);
    };

    const handleAdjustStock = async () => {
        if (!selectedIngredient) return;
        setIsSaving(true);
        try {
            await api.post(`/inventory/stock`, {
                ingredientId: selectedIngredient.id,
                type: adjustData.type,
                quantity: adjustData.quantity,
                reason: adjustData.reason,
                tenantId,
            });
            toast.success('Stock adjusted successfully');
            setShowAdjustModal(false);
            fetchData();
        } catch (error) {
            console.error('Failed to adjust stock', error);
            toast.error('Failed to adjust stock');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResolveAlert = async (id: string) => {
        try {
            await api.patch(`/inventory/alerts/${id}/resolve`, {});
            toast.success('Alert resolved');
            fetchData();
        } catch (error) {
            console.error('Failed to resolve alert', error);
            toast.error('Failed to resolve alert');
        }
    };

    const filteredIngredients = ingredients.filter(i => {
        const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBranch = filterBranch === 'all' || (i.branchId === filterBranch);
        return matchesSearch && matchesBranch;
    });

    const handleDownloadReport = () => {
        const columns = ['Ingredient Name', 'Current Stock', 'Unit', 'Cost per Unit', 'Status'];
        const data = ingredients.map(item => [
            item.name,
            item.currentStock.toString(),
            item.unit,
            `LKR ${Number(item.costPerUnit).toFixed(2)}`,
            item.currentStock < 10 ? 'Low Stock' : 'In Stock'
        ]);

        generateReport({
            title: 'Inventory Report',
            columns,
            data,
            filename: 'inventory_report',
            tenantId,
            token: token || ''
        });
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
                    <p className="text-gray-500">Manage your ingredients and stock levels</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={handleDownloadReport}
                        className="flex items-center gap-2"
                    >
                        <Download size={20} />
                        <span className="hidden sm:inline">Download Report</span>
                    </Button>
                    <Button
                        onClick={() => {
                            setEditingIngredient(null);
                            setFormData({ name: '', unit: 'kg', costPerUnit: 0, currentStock: 0, branchId: '' });
                            setIsBranchSpecific(false);
                            setShowModal(true);
                        }}
                    >
                        <Plus size={20} className="mr-2" />
                        Add Ingredient
                    </Button>
                </div>
            </div>

            {alerts.length > 0 && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h3 className="text-lg font-bold text-yellow-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="text-yellow-600" /> Kitchen Stock Alerts
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alerts.map((alert) => (
                            <div key={alert.id} className="bg-white p-4 rounded-lg border border-yellow-100 shadow-sm flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800">{alert.ingredient.name}</p>
                                    <p className="text-xs text-gray-500 mb-1">{alert.branch?.name || 'All Branches'} • {new Date(alert.createdAt).toLocaleTimeString()}</p>
                                    {alert.notes && <p className="text-sm text-gray-600 italic">"{alert.notes}"</p>}
                                </div>
                                <button
                                    onClick={() => handleResolveAlert(alert.id)}
                                    className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors"
                                    title="Mark as Resolved"
                                >
                                    <CheckCircle size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )
            }

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
                                    <td className="px-6 py-4 text-gray-500">LKR {ingredient.costPerUnit}</td>
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
            {
                showModal && (
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
                                            onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                                            min="0"
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
                                            onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                                            min="0"
                                        />
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="checkbox"
                                            id="branchSpecific"
                                            checked={isBranchSpecific}
                                            onChange={(e) => {
                                                setIsBranchSpecific(e.target.checked);
                                                if (!e.target.checked) {
                                                    setFormData({ ...formData, branchId: '' });
                                                }
                                            }}
                                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                        />
                                        <label htmlFor="branchSpecific" className="text-sm font-medium text-gray-700">
                                            Assign to specific branch
                                        </label>
                                    </div>

                                    {isBranchSpecific && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Branch</label>
                                            <select
                                                className="w-full p-2 border rounded-lg"
                                                value={formData.branchId}
                                                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                                            >
                                                <option value="">Select Branch</option>
                                                {branches.map((branch) => (
                                                    <option key={branch.id} value={branch.id}>
                                                        {branch.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <Button
                                    onClick={handleSave}
                                    isLoading={isSaving}
                                >
                                    {editingIngredient ? 'Save Changes' : 'Create'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Adjust Stock Modal */}
            {
                showAdjustModal && selectedIngredient && (
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
                                        value={adjustData.quantity || ''}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setAdjustData({ ...adjustData, quantity: isNaN(val) ? 0 : val });
                                        }}
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
                                <Button
                                    onClick={handleAdjustStock}
                                    isLoading={isSaving}
                                >
                                    Confirm Adjustment
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Ingredient?"
                message="Are you sure you want to delete this ingredient? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </>
    );
}
