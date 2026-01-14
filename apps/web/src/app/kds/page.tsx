'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { Clock, CheckCircle, PlayCircle, LogOut, AlertTriangle, Package } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

interface OrderItem {
    id: string;
    product: {
        name: string;
    };
    quantity: number;
}

interface Order {
    id: string;
    status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    items: OrderItem[];
    createdAt: string;
    tenantId: string;
    tenantId: string;
    orderNumber?: string;
    orderType?: 'dining' | 'takeaway';
}

interface DecodedToken {
    tenantId: string;
    branchId?: string;
}

interface Ingredient {
    id: string;
    name: string;
    currentStock: number;
    unit: string;
}

export default function KdsPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const token = useAuthStore((state) => state.token);
    const setToken = useAuthStore((state) => state.setToken);
    const router = useRouter();
    const [tenantId, setTenantId] = useState<string>('');
    const [branchId, setBranchId] = useState<string>('');

    const [confirmModal, setConfirmModal] = useState<{ show: boolean; orderId: string | null }>({ show: false, orderId: null });
    const [cancelModal, setCancelModal] = useState<{ show: boolean; orderId: string | null }>({ show: false, orderId: null });
    const [cancellationReason, setCancellationReason] = useState('');

    // Stock Report Modal
    const [showReportModal, setShowReportModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [selectedIngredientId, setSelectedIngredientId] = useState('');
    const [reportNotes, setReportNotes] = useState('');

    useEffect(() => {
        if (token) {
            try {
                const decoded: DecodedToken = jwtDecode(token);
                setTenantId(decoded.tenantId);
                if (decoded.branchId) {
                    setBranchId(decoded.branchId);
                }
            } catch (error) {
                console.error('Invalid token', error);
            }
        }
    }, [token]);

    useEffect(() => {
        // Fetch initial active orders
        const fetchOrders = async () => {
            try {
                const url = branchId
                    ? `http://localhost:3001/kds/active?tenantId=${tenantId}&branchId=${branchId}`
                    : `http://localhost:3001/kds/active?tenantId=${tenantId}`;

                const response = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrders(response.data);
            } catch (error) {
                console.error('Failed to fetch orders', error);
            }
        };

        if (token && tenantId) {
            fetchOrders();
        }

        // Connect to WebSocket
        if (tenantId) {
            const newSocket = io('http://localhost:3001/kds');
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Connected to KDS');
                const room = branchId ? `${tenantId}_${branchId}` : tenantId;
                newSocket.emit('joinRoom', room);
                console.log(`Joining room: ${room}`);
            });

            newSocket.on('orderToKitchen', (order: Order) => {
                console.log('New order received:', order);
                setOrders((prev) => [...prev, order]);
            });

            newSocket.on('updateStatus', (updatedOrder: Order) => {
                setOrders((prev) => {
                    // If status is ready/completed/cancelled, remove from list (or move to separate list)
                    // For now, let's keep 'preparing' and remove 'ready'
                    if (updatedOrder.status === 'ready' || updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
                        return prev.filter(o => o.id !== updatedOrder.id);
                    }
                    return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
                });
            });

            return () => {
                newSocket.disconnect();
            };
        }
    }, [token, tenantId]);

    const updateStatus = async (orderId: string, status: string, reason?: string) => {
        try {
            await axios.put(`http://localhost:3001/kds/orders/${orderId}/status`, { status, tenantId, reason }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Optimistic update
            setOrders((prev) => {
                if (status === 'ready' || status === 'cancelled') {
                    return prev.filter(o => o.id !== orderId);
                }
                return prev.map(o => o.id === orderId ? { ...o, status: status as any } : o);
            });
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const handleReadyClick = (orderId: string) => {
        setConfirmModal({ show: true, orderId });
    };

    const handleCancelClick = (orderId: string) => {
        setCancelModal({ show: true, orderId });
        setCancellationReason('');
    };

    const confirmReady = () => {
        if (confirmModal.orderId) {
            updateStatus(confirmModal.orderId, 'ready');
            setConfirmModal({ show: false, orderId: null });
        }
    };

    const confirmCancel = () => {
        if (cancelModal.orderId) {
            if (!cancellationReason.trim()) {
                alert('Please enter a cancellation reason');
                return;
            }
            updateStatus(cancelModal.orderId, 'cancelled', cancellationReason);
            setCancelModal({ show: false, orderId: null });
        }
    };

    const closeModals = () => {
        setConfirmModal({ show: false, orderId: null });
        setCancelModal({ show: false, orderId: null });
        setShowReportModal(false);
        setShowStockModal(false);
    };

    const handleLogout = () => {
        setToken('');
        router.push('/login');
    };

    const handleOpenReportModal = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/inventory/ingredients?tenantId=${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIngredients(response.data);
            setShowReportModal(true);
        } catch (error) {
            console.error('Failed to fetch ingredients', error);
            toast.error('Failed to load ingredients');
        }
    };

    const handleOpenStockModal = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/inventory/ingredients?tenantId=${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIngredients(response.data);
            setShowStockModal(true);
        } catch (error) {
            console.error('Failed to fetch ingredients', error);
            toast.error('Failed to load stock');
        }
    };

    const handleSubmitReport = async () => {
        if (!selectedIngredientId) {
            toast.error('Please select an ingredient');
            return;
        }
        try {
            await axios.post('http://localhost:3001/inventory/alerts', {
                ingredientId: selectedIngredientId,
                notes: reportNotes,
                tenantId,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Low stock reported to manager');
            setShowReportModal(false);
            setSelectedIngredientId('');
            setReportNotes('');
        } catch (error) {
            console.error('Failed to report stock', error);
            toast.error('Failed to send report');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 p-4 text-white">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Kitchen Display System</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleOpenStockModal}
                        className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-500 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mr-2"
                    >
                        <Package size={20} /> View Stock
                    </button>
                    <button
                        onClick={handleOpenReportModal}
                        className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-500 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mr-4"
                    >
                        <AlertTriangle size={20} /> Report Low Stock
                    </button>
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm text-gray-400">Live</span>
                    <button
                        onClick={handleLogout}
                        className="ml-4 bg-red-600/20 hover:bg-red-600/30 text-red-500 p-2 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {orders.map((order) => (
                    <div key={order.id} className={`bg-gray-800 rounded-xl overflow-hidden border-l-4 ${order.status === 'preparing' ? 'border-yellow-500' : 'border-blue-500'} relative group`}>
                        <div className="p-4 border-b border-gray-700 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg">{order.orderNumber || `Order #${order.id.slice(0, 8)}`}</h3>
                                    {order.orderType && (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.orderType === 'takeaway' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'
                                            }`}>
                                            {order.orderType}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === 'preparing' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                {order.status}
                            </div>
                        </div>

                        <div className="p-4 space-y-3 min-h-[150px]">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center">
                                    <span className="font-medium text-lg">{item.quantity}x {item.product.name}</span>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-gray-700/50 flex gap-2">
                            {order.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => handleCancelClick(order.id)}
                                        className="bg-red-600/20 hover:bg-red-600/40 text-red-500 p-3 rounded-lg font-bold transition-colors"
                                        title="Cancel Order"
                                    >
                                        <LogOut size={20} className="rotate-180" />
                                    </button>
                                    <button
                                        onClick={() => updateStatus(order.id, 'preparing')}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <PlayCircle size={20} /> Start
                                    </button>
                                </>
                            )}
                            {order.status === 'preparing' && (
                                <button
                                    onClick={() => handleReadyClick(order.id)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <CheckCircle size={20} /> Ready
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {orders.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-[60vh] text-gray-500">
                        <Clock size={64} className="mb-4 opacity-20" />
                        <p className="text-xl">No active orders</p>
                    </div>
                )}
            </div>

            {/* Ready Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl max-w-sm w-full border border-gray-700 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-white">Complete Order?</h3>
                        <p className="text-gray-300 mb-6">Are you sure this order is ready? It will be removed from the KDS.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModals}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReady}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
                            >
                                OK, Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Order Modal */}
            {cancelModal.show && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl max-w-sm w-full border border-gray-700 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-white text-red-500">Cancel Order?</h3>
                        <p className="text-gray-300 mb-4">Please provide a reason for cancellation.</p>
                        <textarea
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white mb-6 focus:outline-none focus:border-red-500"
                            rows={3}
                            placeholder="e.g. Out of stock, Customer changed mind..."
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModals}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={confirmCancel}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                            >
                                Confirm Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Low Stock Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl max-w-sm w-full border border-gray-700 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                            <AlertTriangle className="text-yellow-500" /> Report Low Stock
                        </h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Ingredient</label>
                                <select
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-500"
                                    value={selectedIngredientId}
                                    onChange={(e) => setSelectedIngredientId(e.target.value)}
                                >
                                    <option value="">Select Ingredient</option>
                                    {ingredients.map((ing) => (
                                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Notes (Optional)</label>
                                <textarea
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-500"
                                    rows={2}
                                    placeholder="e.g. Almost empty, only 2 left..."
                                    value={reportNotes}
                                    onChange={(e) => setReportNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModals}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReport}
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold transition-colors"
                            >
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Stock Modal */}
            {showStockModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl max-w-2xl w-full border border-gray-700 shadow-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Package className="text-blue-500" /> Current Stock Levels
                            </h3>
                            <button onClick={closeModals} className="text-gray-400 hover:text-white">
                                <LogOut size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 pr-2">
                            <table className="w-full text-left text-gray-300">
                                <thead className="text-xs uppercase bg-gray-900/50 text-gray-400 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Ingredient</th>
                                        <th className="px-4 py-3">Stock Level</th>
                                        <th className="px-4 py-3 rounded-r-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {ingredients.map((ing) => (
                                        <tr key={ing.id} className="hover:bg-gray-700/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-white">{ing.name}</td>
                                            <td className="px-4 py-3 font-mono">{ing.currentStock} {ing.unit}</td>
                                            <td className="px-4 py-3">
                                                {ing.currentStock < 10 ? (
                                                    <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                                                        <AlertTriangle size={12} /> Low
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">OK</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={closeModals}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
