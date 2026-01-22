'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';

import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { generateReport } from '@/lib/report-generator';
import { Plus, Trash2, Edit2, Users, Search, Phone, Mail, Star, Download } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

interface Customer {
    id: string;
    name: string;
    phoneNumber: string;
    email: string;
    loyaltyPoints: number;
}

interface DecodedToken {
    tenantId: string;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        email: '',
        loyaltyPoints: 0,
    });
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const token = useAuthStore((state) => state.token);
    const [tenantId, setTenantId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

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

    const fetchCustomers = async () => {
        try {
            const response = await api.get(`/customers?tenantId=${tenantId}`);
            setCustomers(response.data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && tenantId) {
            fetchCustomers();
        }
    }, [token, tenantId]);

    const handleSaveCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await api.patch(`/customers/${editingCustomer.id}`, {
                    ...formData,
                });
                toast.success('Customer updated successfully');
            } else {
                await api.post('/customers', {
                    ...formData,
                    tenantId,
                });
                toast.success('Customer created successfully');
            }
            setShowModal(false);
            setEditingCustomer(null);
            fetchCustomers();
            setFormData({ name: '', phoneNumber: '', email: '', loyaltyPoints: 0 });
        } catch (error) {
            console.error('Failed to save customer', error);
            toast.error('Failed to save customer');
        }
    };

    const handleEditCustomer = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            phoneNumber: customer.phoneNumber || '',
            email: customer.email || '',
            loyaltyPoints: customer.loyaltyPoints || 0,
        });
        setShowModal(true);
    };

    const handleDeleteCustomer = async (id: string) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            await api.delete(`/customers/${id}`);
            toast.success('Customer deleted successfully');
            fetchCustomers();
        } catch (error) {
            console.error('Failed to delete customer', error);
            toast.error('Failed to delete customer');
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phoneNumber && c.phoneNumber.includes(searchTerm))
    );

    const handleDownloadReport = () => {
        const columns = ['Customer Name', 'Phone', 'Email', 'Loyalty Points'];
        const data = filteredCustomers.map(customer => [
            customer.name,
            customer.phoneNumber || '-',
            customer.email || '-',
            (customer.loyaltyPoints || 0).toString()
        ]);

        generateReport({
            title: 'Customer List Report',
            columns,
            data,
            filename: 'customers_report',
            tenantId,
            token: token || ''
        });
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
                        <p className="text-gray-500">Manage your customer base and loyalty</p>
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
                                setEditingCustomer(null);
                                setFormData({ name: '', phoneNumber: '', email: '', loyaltyPoints: 0 });
                                setShowModal(true);
                            }}
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Plus size={20} /> Add Customer
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search customers by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCustomers.map((customer) => (
                            <div key={customer.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between group hover:border-primary/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 font-bold text-xl">
                                        {customer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditCustomer(customer)}
                                            className="text-gray-400 hover:text-blue-500 transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCustomer(customer.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Phone size={14} />
                                        <span>{customer.phoneNumber || 'No phone'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Mail size={14} />
                                        <span>{customer.email || 'No email'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit mt-2">
                                        <Star size={14} fill="currentColor" />
                                        <span>{customer.loyaltyPoints} Points</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                                <Users size={48} className="mb-4 opacity-50" />
                                <p className="text-lg font-medium">No customers found</p>
                                <p className="text-sm">Add a new customer to get started</p>
                            </div>
                        )}
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
                            <form onSubmit={handleSaveCustomer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2 border rounded-lg mt-1"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        className="w-full p-2 border rounded-lg mt-1"
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-2 border rounded-lg mt-1"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Loyalty Points</label>
                                    <input
                                        type="number"
                                        value={formData.loyaltyPoints}
                                        onChange={(e) => setFormData({ ...formData, loyaltyPoints: parseInt(e.target.value) || 0 })}
                                        className="w-full p-2 border rounded-lg mt-1"
                                        placeholder="0"
                                        min="0"
                                    />
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
                                        {editingCustomer ? 'Save Changes' : 'Create Customer'}
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
