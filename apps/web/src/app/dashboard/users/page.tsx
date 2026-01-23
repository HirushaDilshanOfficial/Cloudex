'use client';

import React, { useEffect, useState } from 'react';

import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { generateReport } from '@/lib/report-generator';
import { Plus, Trash2, User, Pencil, Download } from 'lucide-react';

import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    branchId?: string;
    branch?: {
        id: string;
        name: string;
    };
}

interface Branch {
    id: string;
    name: string;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'cashier',
        branchId: '',
    });
    const [error, setError] = useState('');
    const token = useAuthStore((state) => state.token);
    const [tenantId, setTenantId] = useState<string>('');
    const [currentUserId, setCurrentUserId] = useState<string>('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [branchFilter, setBranchFilter] = useState('all');

    // Delete State
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setTenantId(decoded.tenantId);
                setCurrentUserId(decoded.sub); // Assuming 'sub' holds the user ID in the token, standard for JWT. Or check auth store. User interface defines id.Token payload usually has sub=userId. Let's verify token payload structure in Login or Auth service if unsure, but 'sub' is standard. Wait, let's check what UseAuthStore has. UseAuthStore has user object.
            } catch (error) {
                console.error('Invalid token', error);
            }
        }
    }, [token]);

    useEffect(() => {
        if (tenantId) {
            fetchData();
        }
    }, [tenantId]);

    const fetchData = async () => {
        try {
            const [usersRes, branchesRes] = await Promise.all([
                api.get(`/users?tenantId=${tenantId}`),
                api.get(`/branches`),
            ]);
            setUsers(usersRes.data);
            setBranches(branchesRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (editingUser) {
                await api.patch(`/users/${editingUser.id}`, {
                    ...formData,
                    branchId: formData.branchId || null,
                });
                toast.success('User updated successfully');
            } else {
                await api.post(`/users`, {
                    ...formData,
                    branchId: formData.branchId || null,
                    tenantId,
                });
                toast.success('User created successfully');
            }
            setShowModal(false);
            fetchData();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to save user');
        }
    };

    const handleDeleteUser = (id: string) => {
        setUserToDelete(id);
        setShowDeleteConfirmation(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/users/${userToDelete}`);
            toast.success('User deleted successfully');
            fetchData();
            setShowDeleteConfirmation(false);
            setUserToDelete(null);
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: '',
            role: user.role,
            branchId: user.branchId || '',
        });
        setShowModal(true);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.firstName.toLowerCase() + ' ' + user.lastName.toLowerCase() + ' ' + user.email.toLowerCase()).includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesBranch = branchFilter === 'all' ||
            (branchFilter === 'none' && !user.branchId) ||
            (user.branchId === branchFilter);
        return matchesSearch && matchesRole && matchesBranch;
    });

    const handleDownloadReport = () => {
        const columns = ['Name', 'Email', 'Role', 'Branch'];
        const data = filteredUsers.map(user => [
            `${user.firstName} ${user.lastName}`,
            user.email,
            user.role.toUpperCase(),
            user.branch?.name || '-'
        ]);

        generateReport({
            title: 'Staff List Report',
            columns,
            data,
            filename: 'staff_report',
            tenantId,
            token: token || ''
        });
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                        <p className="text-gray-500">Manage staff accounts and roles</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleDownloadReport}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <Download size={20} />
                            <span className="hidden sm:inline">Download List</span>
                        </button>
                        <button
                            onClick={() => {
                                setEditingUser(null);
                                setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'cashier', branchId: '' });
                                setError('');
                                setShowModal(true);
                            }}
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Plus size={20} /> Add User
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Search Staff</label>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Role</label>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="cashier">Cashier</option>
                            <option value="kitchen">Kitchen</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Branch</label>
                        <select
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="all">All Branches</option>
                            <option value="none">No Branch (Head Office)</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Branch</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                                <User size={16} />
                                            </div>
                                            <span className="font-medium text-gray-900">{user.firstName} {user.lastName}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase
                                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                                                        user.role === 'cashier' ? 'bg-green-100 text-green-700' :
                                                            'bg-yellow-100 text-yellow-700'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {user.branch?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors mr-2"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h2>
                            {error && (
                                <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full p-2 border rounded-lg mt-1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full p-2 border rounded-lg mt-1"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => {
                                            setFormData({ ...formData, email: e.target.value });
                                            setError('');
                                        }}
                                        className="w-full p-2 border rounded-lg mt-1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full p-2 border rounded-lg mt-1"
                                        required={!editingUser}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full p-2 border rounded-lg mt-1 disabled:opacity-50 disabled:bg-gray-100"
                                        disabled={editingUser?.id === currentUserId}
                                        title={editingUser?.id === currentUserId ? "You cannot change your own role" : ""}
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                        <option value="cashier">Cashier</option>
                                        <option value="kitchen">Kitchen</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Branch</label>
                                    <select
                                        value={formData.branchId}
                                        onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                                        className="w-full p-2 border rounded-lg mt-1"
                                    >
                                        <option value="">No Branch (All Access if Admin)</option>
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
                                        {editingUser ? 'Save Changes' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={showDeleteConfirmation}
                onClose={() => setShowDeleteConfirmation(false)}
                onConfirm={confirmDeleteUser}
                title="Delete User?"
                message="Are you sure you want to delete this user? This action cannot be undone."
                confirmText="Yes, Delete User"
                variant="danger"
            />
        </>
    );
}
