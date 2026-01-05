'use client';

import React, { useEffect, useState } from 'react';
import { TenantLayout } from '@/components/tenant/tenant-layout';
import { useAuthStore } from '@/store/auth-store';
import axios from 'axios';
import { Plus, Trash2, User, Pencil } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

interface DecodedToken {
    tenantId: string;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'cashier',
    });
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const token = useAuthStore((state) => state.token);
    const [tenantId, setTenantId] = useState<string>('');
    const [error, setError] = useState<string>('');

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

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/users?tenantId=${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && tenantId) {
            fetchUsers();
        }
    }, [token, tenantId]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await axios.put(`http://localhost:3001/users/${editingUser.id}`, {
                    ...formData,
                    tenantId,
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('http://localhost:3001/users', {
                    ...formData,
                    tenantId,
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            setEditingUser(null);
            fetchUsers();
            setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'cashier' });
        } catch (error: any) {
            console.error('Failed to save user', error);
            if (error.response && error.response.status === 409) {
                setError('Email already exists. Please use a different email.');
            } else {
                setError('Failed to save user. Please try again.');
            }
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            password: '', // Don't populate password
            role: user.role,
        });
        setShowModal(true);
        setError('');
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`http://localhost:3001/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user', error);
        }
    };

    return (
        <TenantLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                        <p className="text-gray-500">Manage staff accounts and roles</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'cashier' });
                            setError('');
                            setShowModal(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} /> Add User
                    </button>
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
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map((user) => (
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
                                        className="w-full p-2 border rounded-lg mt-1"
                                    >
                                        <option value="manager">Manager</option>
                                        <option value="cashier">Cashier</option>
                                        <option value="kitchen">Kitchen</option>
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
        </TenantLayout>
    );
}
