'use client';

import React, { useEffect, useState } from 'react';
import { TenantLayout } from '@/components/tenant/tenant-layout';
import { useAuthStore } from '@/store/auth-store';
import axios from 'axios';
import { Eye, Clock, CheckCircle, XCircle, PlayCircle, Armchair } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

interface OrderItem {
    id: string;
    quantity: number;
    product: {
        name: string;
        price: number;
    };
}

interface Order {
    id: string;
    createdAt: string;
    status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    items: OrderItem[];
    table?: {
        name: string;
    };
    cashier?: {
        firstName: string;
        lastName: string;
    };
    branch?: {
        name: string;
    };
}

interface DecodedToken {
    tenantId: string;
}

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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

    const fetchOrders = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/orders?tenantId=${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && tenantId) {
            fetchOrders();
        }
    }, [token, tenantId]);

    const calculateTotal = (items: OrderItem[]) => {
        return items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'ready': return 'bg-blue-100 text-blue-700';
            case 'preparing': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <TenantLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Order History</h1>
                        <p className="text-gray-500">View and manage past orders</p>
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
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Branch</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Table</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Items</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600">
                                            #{order.id.slice(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {order.branch?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.table ? (
                                                <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                                                    <Armchair size={14} /> {order.table.name}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {order.items.length} items
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            ${calculateTotal(order.items).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {orders.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                No orders found
                            </div>
                        )}
                    </div>
                )}

                {selectedOrder && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                                    <p className="text-gray-500">#{selectedOrder.id}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500 mb-1">Status</p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500 mb-1">Date</p>
                                    <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500 mb-1">Table</p>
                                    <p className="font-medium">{selectedOrder.table?.name || 'N/A'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500 mb-1">Cashier</p>
                                    <p className="font-medium">
                                        {selectedOrder.cashier ? `${selectedOrder.cashier.firstName} ${selectedOrder.cashier.lastName}` : 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500 mb-1">Branch</p>
                                    <p className="font-medium">{selectedOrder.branch?.name || 'N/A'}</p>
                                </div>
                            </div>

                            <h3 className="font-bold text-lg mb-4">Items</h3>
                            <div className="space-y-3 mb-8">
                                {selectedOrder.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-4">
                                            <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                                                {item.quantity}x
                                            </span>
                                            <span className="font-medium text-gray-800">{item.product.name}</span>
                                        </div>
                                        <span className="font-medium text-gray-900">
                                            ${(item.product.price * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                <span className="text-2xl font-bold text-primary">
                                    ${calculateTotal(selectedOrder.items).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TenantLayout>
    );
}
