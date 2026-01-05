'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { Clock, CheckCircle, PlayCircle, LogOut } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

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
}

interface DecodedToken {
    tenantId: string;
}

export default function KdsPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const token = useAuthStore((state) => state.token);
    const setToken = useAuthStore((state) => state.setToken);
    const router = useRouter();
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

    useEffect(() => {
        // Fetch initial active orders
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/kds/active?tenantId=${tenantId}`, {
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
                newSocket.emit('joinRoom', tenantId);
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

    const updateStatus = async (orderId: string, status: string) => {
        try {
            await axios.put(`http://localhost:3001/kds/orders/${orderId}/status`, { status, tenantId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Optimistic update
            setOrders((prev) => {
                if (status === 'ready') {
                    return prev.filter(o => o.id !== orderId);
                }
                return prev.map(o => o.id === orderId ? { ...o, status: status as any } : o);
            });
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const handleLogout = () => {
        setToken('');
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-900 p-4 text-white">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Kitchen Display System</h1>
                <div className="flex items-center gap-2">
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
                    <div key={order.id} className={`bg-gray-800 rounded-xl overflow-hidden border-l-4 ${order.status === 'preparing' ? 'border-yellow-500' : 'border-blue-500'}`}>
                        <div className="p-4 border-b border-gray-700 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg">Order #{order.id.slice(0, 8)}</h3>
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
                                <button
                                    onClick={() => updateStatus(order.id, 'preparing')}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <PlayCircle size={20} /> Start
                                </button>
                            )}
                            {order.status === 'preparing' && (
                                <button
                                    onClick={() => updateStatus(order.id, 'ready')}
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
        </div>
    );
}
