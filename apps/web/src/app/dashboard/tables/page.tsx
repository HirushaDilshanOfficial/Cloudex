'use client';

import React, { useEffect, useState } from 'react';

import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, Armchair } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

interface Table {
    id: string;
    name: string;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved';
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

export default function TableManagementPage() {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        capacity: 4,
        branchId: '',
    });
    const [branches, setBranches] = useState<Branch[]>([]);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const token = useAuthStore((state) => state.token);
    const [tenantId, setTenantId] = useState<string>('');

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterBranch, setFilterBranch] = useState('all');

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

    const fetchTables = async () => {
        try {
            const response = await api.get(`/tables?tenantId=${tenantId}`);
            setTables(response.data);
        } catch (error) {
            console.error('Failed to fetch tables', error);
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

    useEffect(() => {
        if (token && tenantId) {
            fetchTables();
            fetchBranches();
        }
    }, [token, tenantId]);

    const handleSaveTable = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTable) {
                await api.patch(`/tables/${editingTable.id}`, {
                    ...formData,
                });
            } else {
                await api.post('/tables', {
                    ...formData,
                    tenantId,
                });
            }
            setShowModal(false);
            setEditingTable(null);
            setShowModal(false);
            setEditingTable(null);
            fetchTables();
            setFormData({ name: '', capacity: 4, branchId: '' });
            toast.success(editingTable ? 'Table updated successfully' : 'Table created successfully');
        } catch (error) {
            console.error('Failed to save table', error);
            toast.error('Failed to save table');
        }
    };

    const handleEditTable = (table: Table) => {
        setEditingTable(table);
        setFormData({
            name: table.name,
            capacity: table.capacity,
            branchId: table.branch?.id || '',
        });
        setShowModal(true);
    };

    const handleDeleteTable = async (id: string) => {
        if (!confirm('Are you sure you want to delete this table?')) return;
        try {
            await api.delete(`/tables/${id}`);
            fetchTables();
        } catch (error: any) {
            console.error('Failed to delete table', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete table';

            // Check if error suggests archiving (based on our backend logic)
            if (errorMessage.includes('archive')) {
                if (confirm('This table has existing orders and cannot be deleted. Would you like to archive it instead? Archived tables will be hidden.')) {
                    try {
                        await api.patch(`/tables/${id}/archive`);
                        toast.success('Table archived successfully');
                        fetchTables();
                    } catch (archiveError) {
                        console.error('Failed to archive table', archiveError);
                        toast.error('Failed to archive table');
                    }
                }
            } else {
                toast.error(errorMessage);
            }
        }
    };

    const filteredTables = tables.filter(table => {
        const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || table.status === filterStatus;
        const matchesBranch = filterBranch === 'all' || table.branch?.id === filterBranch;

        return matchesSearch && matchesStatus && matchesBranch;
    });

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Table Management</h1>
                        <p className="text-gray-500">Manage restaurant tables and capacity</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setEditingTable(null);
                                setFormData({ name: '', capacity: 4, branchId: '' });
                                setShowModal(true);
                            }}
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Plus size={20} /> Add Table
                        </button>
                        <button
                            onClick={async () => {
                                if (confirm('Are you sure you want to delete ALL tables? Tables with orders will be archived.')) {
                                    try {
                                        const res = await api.delete(`/tables/bulk-cleanup?tenantId=${tenantId}`);
                                        toast.success(`Cleanup complete: ${res.data.deleted} deleted, ${res.data.archived} archived`);
                                        fetchTables();
                                    } catch (e) {
                                        console.error(e);
                                        toast.error('Cleanup failed');
                                    }
                                }
                            }}
                            className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Trash2 size={20} /> Cleanup All
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <input
                        type="text"
                        placeholder="Search tables..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary flex-1 sm:w-64"
                    />
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
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                    >
                        <option value="all">All Status</option>
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="reserved">Reserved</option>
                    </select>
                </div>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredTables.map((table) => (
                            <div key={table.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between group hover:border-primary/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <Armchair size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditTable(table)}
                                            className="text-gray-400 hover:text-blue-500 transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTable(table.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{table.name}</h3>
                                    <p className="text-sm text-gray-500">{table.capacity} Seats</p>
                                    {table.branch && (
                                        <p className="text-xs text-gray-400 mt-1">{table.branch.name}</p>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase
                                        ${table.status === 'available' ? 'bg-green-100 text-green-700' :
                                            table.status === 'occupied' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'}`}>
                                        {table.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {filteredTables.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                                <Armchair size={48} className="mb-4 opacity-50" />
                                <p className="text-lg font-medium">No tables found</p>
                                <p className="text-sm">Try adjusting your filters</p>
                            </div>
                        )}
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">{editingTable ? 'Edit Table' : 'Add New Table'}</h2>
                            <form onSubmit={handleSaveTable} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Table Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2 border rounded-lg mt-1"
                                        placeholder="e.g. Table 1, T1, Patio 2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Capacity</label>
                                    <input
                                        type="number"
                                        value={formData.capacity || ''}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                                        className="w-full p-2 border rounded-lg mt-1"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Branch</label>
                                    <select
                                        value={formData.branchId}
                                        onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                                        className="w-full p-2 border rounded-lg mt-1"
                                    >
                                        <option value="">Select Branch (Optional)</option>
                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
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
                                        {editingTable ? 'Save Changes' : 'Create Table'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
