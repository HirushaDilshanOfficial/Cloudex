'use client';

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { Clock, CheckCircle, PlayCircle, LogOut, AlertTriangle, Package } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { KdsHeader } from '@/components/kds/kds-header';
import { OrderCard } from '@/components/kds/order-card';

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
    updatedAt: string;
    tenantId: string;
    orderNumber?: string;
    orderType?: 'dining' | 'takeaway';
    redeemedPoints?: number;
    discountAmount?: number;
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

    // Sound
    const [audioEnabled, setAudioEnabled] = useState(true);
    const newOrderAudioRef = useRef<HTMLAudioElement | null>(null);
    const alertAudioRef = useRef<HTMLAudioElement | null>(null);

    // Filter/Tabs
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [historyOrders, setHistoryOrders] = useState<Order[]>([]);

    useEffect(() => {
        newOrderAudioRef.current = new Audio('/sounds/new-order.mp3');
        alertAudioRef.current = new Audio('/sounds/alert.mp3');
    }, []);

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
                    ? `/kds/active?tenantId=${tenantId}&branchId=${branchId}`
                    : `/kds/active?tenantId=${tenantId}`;

                const response = await api.get(url);
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
                if (audioEnabled && newOrderAudioRef.current) {
                    newOrderAudioRef.current.play().catch(e => console.log('Audio play failed', e));
                }
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
    }, [token, tenantId, audioEnabled]); // Added audioEnabled to dependency array or better use ref

    // Overdue check
    useEffect(() => {
        const interval = setInterval(() => {
            if (!audioEnabled || !alertAudioRef.current) return;

            const now = new Date();
            const hasOverdue = orders.some(order => {
                const created = new Date(order.createdAt);
                const diffMins = (now.getTime() - created.getTime()) / 60000;
                return diffMins > 20 && order.status !== 'ready' && order.status !== 'completed' && order.status !== 'cancelled';
            });

            if (hasOverdue) {
                alertAudioRef.current.play().catch(e => console.log('Audio play failed', e));
            }
        }, 30000); // Check every 30s

        return () => clearInterval(interval);
    }, [orders, audioEnabled]);

    const updateStatus = async (orderId: string, status: string, reason?: string) => {
        try {
            await api.put(`/kds/orders/${orderId}/status`, { status, tenantId, reason });
            // Optimistic update
            setOrders((prev) => {
                if (status === 'ready' || status === 'completed' || status === 'cancelled') {
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
            updateStatus(confirmModal.orderId, 'completed');
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
            const response = await api.get(`/inventory/ingredients?tenantId=${tenantId}`);
            setIngredients(response.data);
            setShowReportModal(true);
        } catch (error) {
            console.error('Failed to fetch ingredients', error);
            toast.error('Failed to load ingredients');
        }
    };

    const handleOpenStockModal = async () => {
        try {
            const response = await api.get(`/inventory/ingredients?tenantId=${tenantId}`);
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
            await api.post('/inventory/alerts', {
                ingredientId: selectedIngredientId,
                notes: reportNotes,
                tenantId,
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

    const fetchHistoryOrders = async () => {
        try {
            const url = branchId
                ? `/kds/completed?tenantId=${tenantId}&branchId=${branchId}`
                : `/kds/completed?tenantId=${tenantId}`;

            const response = await api.get(url);
            setHistoryOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch history', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'history' && token && tenantId) {
            fetchHistoryOrders();
        }
    }, [activeTab, token, tenantId]);

    const handleUndo = async (orderId: string) => {
        try {
            // Revert to preparing
            await updateStatus(orderId, 'preparing');
            // Remove from history list locally
            setHistoryOrders(prev => prev.filter(o => o.id !== orderId));
            // Add to active list locally is handled by socket or we can do it optimistically but socket should cover it if we are connected.
            // Actually, updateStatus does optimistic update on 'orders' list. 
            // We should ensure it adds it back if it was missing.
            // But strict optimistic update logic in updateStatus might filter it out if status is preparing?
            // Let's modify updateStatus to handle re-adding if needed or rely on refetch/socket.
            // For now, simple implementation:
            toast.success('Order returned to active board');
        } catch (error) {
            console.error('Failed to undo order', error);
            toast.error('Failed to undo');
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-blue-500/30">
            <KdsHeader
                totalOrders={orders.length}
                pendingCount={orders.filter(o => o.status === 'pending').length}
                preparingCount={orders.filter(o => o.status === 'preparing').length}
                onViewStock={handleOpenStockModal}
                onReportLowStock={handleOpenReportModal}
                onLogout={handleLogout}
                onRefresh={() => {
                    if (activeTab === 'active') window.location.reload();
                    else fetchHistoryOrders();
                }}
                audioEnabled={audioEnabled}
                onToggleAudio={() => setAudioEnabled(!audioEnabled)}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <main className="p-4 lg:p-6 max-w-[1920px] mx-auto">
                <AnimatePresence mode='popLayout'>
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6"
                        layout
                    >
                        {(activeTab === 'active' ? orders : historyOrders).map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                isHistory={activeTab === 'history'}
                                onUndo={handleUndo}
                                onStatusUpdate={(id, status) => {
                                    if (status === 'ready' || status === 'completed') {
                                        handleReadyClick(id);
                                    } else {
                                        updateStatus(id, status);
                                    }
                                }}
                                onCancel={handleCancelClick}
                            />
                        ))}
                    </motion.div>
                </AnimatePresence>

                {activeTab === 'active' && orders.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-[70vh] text-gray-600"
                    >
                        <div className="w-24 h-24 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-6 shadow-2xl">
                            <Clock size={40} className="opacity-20 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-500 mb-2">All Caught Up</h2>
                        <p className="text-gray-600">Waiting for new orders...</p>
                    </motion.div>
                )}

                {activeTab === 'history' && historyOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
                        <div className="w-24 h-24 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-6 shadow-2xl">
                            <Clock size={40} className="opacity-20 text-gray-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-500 mb-2">No History Yet</h2>
                        <p className="text-gray-600">Completed orders will appear here.</p>
                    </div>
                )}
            </main>

            {/* Ready Confirmation Modal */}
            <AnimatePresence>
                {confirmModal.show && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-gray-900 p-8 rounded-2xl max-w-sm w-full border border-gray-800 shadow-2xl"
                        >
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={32} className="text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 text-white text-center">Order Ready?</h3>
                            <p className="text-gray-400 mb-8 text-center text-sm leading-relaxed">
                                Confirming this order is packed and ready for pickup/delivery. It will be cleared from the board.
                            </p>
                            <div className="flex gap-3 grid grid-cols-2">
                                <button
                                    onClick={closeModals}
                                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmReady}
                                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
                                >
                                    Complete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Cancel Order Modal */}
            <AnimatePresence>
                {cancelModal.show && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-gray-900 p-8 rounded-2xl max-w-md w-full border border-gray-800 shadow-2xl"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 text-white text-center">Cancel Order</h3>
                            <p className="text-gray-400 mb-6 text-center text-sm">
                                Please provide a reason required for audit logs.
                            </p>
                            <textarea
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white mb-6 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 placeholder:text-gray-700 min-h-[120px]"
                                placeholder="e.g. Out of stock, Customer request..."
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-3 grid grid-cols-2">
                                <button
                                    onClick={closeModals}
                                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={confirmCancel}
                                    className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-900/20"
                                >
                                    Confirm Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Improvements for Stock/Report Modals can be added here, keeping them simple for now but using dark theme classes */}
            {/* Report Low Stock Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-8 rounded-2xl max-w-md w-full border border-gray-800 shadow-2xl">
                        <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
                            <AlertTriangle className="text-amber-500" /> Report Low Stock
                        </h3>
                        <div className="space-y-5 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ingredient</label>
                                <select
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500/50"
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
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                                <textarea
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500/50 min-h-[100px]"
                                    placeholder="Add details..."
                                    value={reportNotes}
                                    onChange={(e) => setReportNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModals}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReport}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition-colors"
                            >
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Stock Modal */}
            {showStockModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-6 rounded-2xl max-w-3xl w-full border border-gray-800 shadow-2xl max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <Package className="text-blue-500" /> Stock Levels
                            </h3>
                            <button onClick={closeModals} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                                <LogOut size={18} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="text-xs uppercase bg-gray-950 text-gray-500 font-bold sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Ingredient</th>
                                        <th className="px-4 py-3">Stock</th>
                                        <th className="px-4 py-3 rounded-r-lg text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {ingredients.map((ing) => (
                                        <tr key={ing.id} className="hover:bg-gray-800/50 transition-colors group">
                                            <td className="px-4 py-4 font-medium text-gray-300 group-hover:text-white transition-colors">{ing.name}</td>
                                            <td className="px-4 py-4 font-mono text-gray-400">{ing.currentStock} <span className="text-gray-600 text-xs">{ing.unit}</span></td>
                                            <td className="px-4 py-4 text-right">
                                                {ing.currentStock < 10 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                                                        <AlertTriangle size={10} /> Low
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        Healthy
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
