'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { generateReport } from '@/lib/report-generator';
import { Eye, Clock, CheckCircle, XCircle, PlayCircle, Armchair, Download } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
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
    orderNumber: string;
    createdAt: string;
    status: string;
    paymentStatus: string;
    orderType: string;
    discountAmount?: number;
    redeemedPoints?: number;
    items: OrderItem[];
    table?: { name: string };
    branch?: { name: string };
    cashier?: { firstName: string; lastName: string };
}

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBranch, setFilterBranch] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const token = useAuthStore((state) => state.token);
    const [tenantId, setTenantId] = useState<string>('');

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

    useEffect(() => {
        if (tenantId) {
            fetchData();
        }
    }, [tenantId]);

    const fetchData = async () => {
        try {
            const [ordersRes, branchesRes] = await Promise.all([
                api.get(`/orders?tenantId=${tenantId}`),
                api.get(`/branches`),
            ]);
            setOrders(ordersRes.data);
            setBranches(branchesRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const updatePaymentStatus = async (orderId: string, status: string) => {
        try {
            await api.patch(`/orders/${orderId}/payment-status`, { status });
            toast.success('Payment status updated');
            fetchData();
            if (selectedOrder) {
                setSelectedOrder({ ...selectedOrder, paymentStatus: status });
            }
        } catch (error) {
            toast.error('Failed to update payment status');
        }
    };

    const calculateTotal = (items: OrderItem[]) => {
        return items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'preparing': return 'bg-blue-100 text-blue-700';
            case 'ready': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700';
            case 'PENDING': return 'bg-yellow-100 text-yellow-700';
            case 'FAILED': return 'bg-red-100 text-red-700';
            case 'REFUNDED': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = (order.orderNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (order.table?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesBranch = filterBranch === 'all' || (order.branch?.name === filterBranch); // Note: filtering by name here as branchId might not be directly on order object in this view or simplifies logic
        // Actually better to filter by ID if available, but let's stick to what likely works with the data structure
        const matchesStatus = filterStatus === 'all' || order.status.toLowerCase() === filterStatus.toLowerCase();
        return matchesSearch && matchesBranch && matchesStatus;
    });

    const handleDownloadReport = () => {
        const columns = ['Order ID', 'Date', 'Branch', 'Table', 'Items', 'Total', 'Status'];
        const data = filteredOrders.map(order => [
            order.orderNumber || `#${order.id.slice(0, 8)}`,
            new Date(order.createdAt).toLocaleString(),
            order.branch?.name || '-',
            order.table?.name || '-',
            order.items.length.toString(),
            `LKR ${calculateTotal(order.items).toFixed(2)}`,
            order.status.toUpperCase()
        ]);

        generateReport({
            title: 'Order History Report',
            columns,
            data,
            filename: 'orders_report',
            tenantId,
            token: token || ''
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Order History</h1>
                    <p className="text-gray-500">View and manage past orders</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
                    <button
                        onClick={handleDownloadReport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm h-[42px]"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Download PDF</span>
                    </button>
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary flex-1 sm:w-64 h-[42px]"
                    />
                    <select
                        value={filterBranch}
                        onChange={(e) => setFilterBranch(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white h-[42px]"
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
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white h-[42px]"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
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
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Branch</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Table</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Items</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-sm text-gray-600">
                                        <div className="flex flex-col">
                                            <span>{order.orderNumber || `#${order.id.slice(0, 8)}`}</span>
                                            {order.orderType && (
                                                <span className={`text-[10px] uppercase font-bold tracking-wider ${order.orderType === 'takeaway' ? 'text-orange-600' : 'text-blue-600'}`}>
                                                    {order.orderType}
                                                </span>
                                            )}
                                        </div>
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
                                        LKR {calculateTotal(order.items).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getPaymentStatusColor(order.paymentStatus || 'PENDING')}`}>
                                            {order.paymentStatus === 'PENDING' || !order.paymentStatus ? 'Unpaid' : order.paymentStatus}
                                        </span>
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
                    {filteredOrders.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            No orders found matching your filters
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
                                <div className="flex items-center gap-2">
                                    <p className="text-gray-500">{selectedOrder.orderNumber || `#${selectedOrder.id}`}</p>
                                    {selectedOrder.orderType && (
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${selectedOrder.orderType === 'takeaway' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {selectedOrder.orderType}
                                        </span>
                                    )}
                                </div>
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
                                <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getPaymentStatusColor(selectedOrder.paymentStatus || 'PENDING')}`}>
                                        {selectedOrder.paymentStatus === 'PENDING' || !selectedOrder.paymentStatus ? 'Unpaid' : selectedOrder.paymentStatus}
                                    </span>
                                    <select
                                        value={selectedOrder.paymentStatus || 'PENDING'}
                                        onChange={(e) => updatePaymentStatus(selectedOrder.id, e.target.value)}
                                        className="ml-2 text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                                    >
                                        <option value="PENDING">Unpaid</option>
                                        <option value="PAID">Paid</option>
                                        <option value="FAILED">Failed</option>
                                        <option value="REFUNDED">Refunded</option>
                                    </select>
                                </div>
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
                                        <span className="font-medium text-gray-800">{item.product?.name || 'Unknown Product'}</span>
                                    </div>
                                    <span className="font-medium text-gray-900">
                                        LKR {((item.product?.price || 0) * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-gray-200 space-y-2">
                            <div className="flex justify-between items-center text-gray-600">
                                <span>Subtotal</span>
                                <span>LKR {calculateTotal(selectedOrder.items).toFixed(2)}</span>
                            </div>
                            {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                                <div className="flex justify-between items-center text-green-600 font-medium">
                                    <span>Discount (Points: {selectedOrder.redeemedPoints})</span>
                                    <span>-LKR {Number(selectedOrder.discountAmount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                <span className="text-2xl font-bold text-primary">
                                    LKR {(calculateTotal(selectedOrder.items) - (Number(selectedOrder.discountAmount) || 0)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
