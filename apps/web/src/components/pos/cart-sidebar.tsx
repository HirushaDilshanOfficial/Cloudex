import React from 'react';
import { useCartStore } from '@/store/cart-store';
import { Trash2, Minus, Plus, Armchair, CheckCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
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
    const [orderType, setOrderType] = useState<'dining' | 'takeaway'>('dining');
    const token = useAuthStore((state) => state.token);
    const [tenantId, setTenantId] = useState<string>('');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Customer State
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');

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
                    (t.status === 'available' || t.status === 'occupied') &&
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.id)
                );
                setTables(validTables);
            } catch (error) {
                console.error('Failed to fetch tables', error);
            }
        };

        if (token && tenantId) {
            fetchTables();
            // Fetch customers
            api.get(`/customers?tenantId=${tenantId}`)
                .then(res => setCustomers(res.data))
                .catch(err => console.error('Failed to fetch customers', err));
        }
    }, [token, tenantId]);

    const handleCheckout = async () => {
        if (items.length === 0) return;

        // Filter out invalid items (self-healing)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validItems = items.filter(item => uuidRegex.test(item.productId));

        if (validItems.length === 0) {
            toast.error('Cart contained only invalid items and has been cleared.');
            clearCart();
            return;
        }

        setIsCheckingOut(true);
        try {
            await api.post('/orders', {
                items: validItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price || 0 // Fallback for stale cart items
                })),
                tenantId,
                tenantId,
                tableId: orderType === 'dining' ? (selectedTable || undefined) : undefined,
                orderType,
                customerId: selectedCustomer?.id,
                totalAmount: Number((total() * 1.1).toFixed(2)), // Include tax in total
            });
            clearCart();
            setSelectedTable('');
            setOrderType('dining');

            // Custom Beautiful Success Toast
            toast.custom((t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'
                        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-green-500`}
                >
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    Order Placed Successfully!
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Sent to kitchen • ${Number((total() * 1.1).toFixed(2))}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-gray-200">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
                        >
                            Close
                        </button>
                    </div>
                </div>
            ), { duration: 4000 });

        } catch (error: any) {
            console.error('Failed to place order', error);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';

            // Auto-clear cart if server rejects due to bad data
            if (error.response?.status === 400) {
                toast.error(`Order failed: ${errorMessage}. Cart cleared.`);
                clearCart();
            } else {
                toast.error(`Failed to place order: ${errorMessage}`);
            }
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Current Order</h2>

                {/* Order Type Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg mb-3">
                    <button
                        onClick={() => setOrderType('dining')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${orderType === 'dining'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Dining
                    </button>
                    <button
                        onClick={() => setOrderType('takeaway')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${orderType === 'takeaway'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Takeaway
                    </button>
                </div>

                <div className="mt-2">
                    <div className="mt-2 flex gap-2">
                        <select
                            value={selectedTable}
                            onChange={(e) => setSelectedTable(e.target.value)}
                            className="flex-1 p-2 border rounded-lg text-sm bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            disabled={orderType === 'takeaway'}
                        >
                            <option value="">{orderType === 'takeaway' ? 'No Table (Takeaway)' : 'Select Table (Optional)'}</option>
                            {orderType === 'dining' && tables.map((table) => (
                                <option key={table.id} value={table.id}>
                                    {table.name} {table.status === 'occupied' ? '(Occupied)' : ''}
                                </option>
                            ))}
                        </select>
                        {orderType === 'dining' && selectedTable && (
                            <button
                                onClick={async () => {
                                    try {
                                        await api.patch(`/tables/${selectedTable}/status`, { status: 'available' });
                                        toast.success('Table cleared');
                                        // Refresh tables
                                        const response = await api.get(`/tables?tenantId=${tenantId}`);
                                        const validTables = response.data.filter((t: Table) =>
                                            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.id)
                                        );
                                        setTables(validTables);
                                    } catch (error) {
                                        toast.error('Failed to clear table');
                                    }
                                }}
                                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium"
                                title="Clear Table (Make Available)"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Customer Selection */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Customer</span>
                </div>
                {selectedCustomer ? (
                    <div className="flex justify-between items-center bg-white p-2 rounded border border-green-200">
                        <div>
                            <p className="text-sm font-bold text-gray-800">{selectedCustomer.name}</p>
                            <p className="text-xs text-gray-500">{selectedCustomer.phoneNumber}</p>
                        </div>
                        <button
                            onClick={() => setSelectedCustomer(null)}
                            className="text-red-500 hover:text-red-700 p-1"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search customer (phone/name)..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="w-full p-2 text-sm border rounded bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        {customerSearch.length > 1 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                                {customers
                                    .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phoneNumber?.includes(customerSearch))
                                    .map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                setSelectedCustomer(c);
                                                setCustomerSearch('');
                                            }}
                                            className="w-full text-left p-2 hover:bg-gray-50 text-sm border-b last:border-0"
                                        >
                                            <div className="font-medium">{c.name}</div>
                                            <div className="text-xs text-gray-500">{c.phoneNumber}</div>
                                        </button>
                                    ))}
                                <button
                                    onClick={() => setShowCustomerModal(true)}
                                    className="w-full text-left p-2 hover:bg-gray-50 text-sm text-primary font-medium flex items-center gap-1"
                                >
                                    <Plus size={14} /> Create "{customerSearch}"
                                </button>
                            </div>
                        )}
                    </div>
                )}
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
        </div >
    );
}
