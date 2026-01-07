import React from 'react';
import { useCartStore } from '@/store/cart-store';
import { Trash2, Minus, Plus, Armchair } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';

interface Table {
    id: string;
    name: string;
    status: string;
}

interface DecodedToken {
    tenantId: string;
}

export function CartSidebar() {
    const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const token = useAuthStore((state) => state.token);
    const [tenantId, setTenantId] = useState<string>('');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

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
        const fetchTables = async () => {
            try {
                const response = await api.get(`/tables?tenantId=${tenantId}`);
                const validTables = response.data.filter((t: Table) =>
                    t.status === 'available' &&
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.id)
                );
                setTables(validTables);
            } catch (error) {
                console.error('Failed to fetch tables', error);
            }
        };

        if (token && tenantId) {
            fetchTables();
        }
    }, [token, tenantId]);

    const handleCheckout = async () => {
        if (items.length === 0) return;
        setIsCheckingOut(true);
        setIsCheckingOut(true);
        try {
            await api.post('/orders', {
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price || 0 // Fallback for stale cart items
                })),
                tenantId,
                tableId: selectedTable || undefined, // Send undefined instead of null for optional field
                totalAmount: Number((total() * 1.1).toFixed(2)), // Include tax in total
            });
            clearCart();
            setSelectedTable('');
            alert('Order placed successfully!');
        } catch (error: any) {
            console.error('Failed to place order', error);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            const errorDetails = JSON.stringify(error.response?.data || {}, null, 2);
            console.log('FULL ERROR DETAILS:', errorDetails); // Explicit log for user to copy
            alert(`Failed to place order: ${errorMessage}\nDetails: ${errorDetails}`);
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
                <div className="mt-2">
                    <select
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <option value="">Select Table (Optional)</option>
                        {tables.map((table) => (
                            <option key={table.id} value={table.id}>
                                {table.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!isMounted ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <p>Loading cart...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <p>Cart is empty</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.productId} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-800">{item.name}</h4>
                                <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-white rounded-md border border-gray-200">
                                    <button
                                        onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                                        className="p-1 hover:bg-gray-100 text-gray-600"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                        className="p-1 hover:bg-gray-100 text-gray-600"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => removeItem(item.productId)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer / Totals */}
            <div className="p-4 bg-white border-t border-gray-200 shadow-lg">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>${isMounted ? total().toFixed(2) : '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Tax (10%)</span>
                        <span>${isMounted ? (total() * 0.1).toFixed(2) : '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-dashed border-gray-300">
                        <span>Total</span>
                        <span>${isMounted ? (total() * 1.1).toFixed(2) : '0.00'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={clearCart}
                        disabled={isCheckingOut}
                        className="px-4 py-3 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCheckout}
                        disabled={isCheckingOut || items.length === 0}
                        className="px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none"
                    >
                        {isCheckingOut ? 'Processing...' : 'Pay Now'}
                    </button>
                </div>
            </div>
        </div>
    );
}
