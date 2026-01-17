import React from 'react';
import { createPortal } from 'react-dom';
import { useCartStore } from '@/store/cart-store';
import { Trash2, Minus, Plus, Armchair, CheckCircle, Users, Search, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { PaymentModal } from './payment-modal';
import { ReceiptModal } from './receipt-modal';
import { CustomerModal } from './customer-modal';
import { ConfirmationModal } from '../ui/confirmation-modal';

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
    const [isEditingCustomer, setIsEditingCustomer] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');

    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [tenantDetails, setTenantDetails] = useState<any>(null);
    const [serviceChargeRate, setServiceChargeRate] = useState(0); // 0 or 0.10
    const [discount, setDiscount] = useState<{ type: 'fixed' | 'percentage'; value: number }>({ type: 'fixed', value: 0 });
    const [showDiscountInput, setShowDiscountInput] = useState(false);

    // Pending Orders State
    const [showPendingOrders, setShowPendingOrders] = useState(false);
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [pendingOrderSearch, setPendingOrderSearch] = useState('');

    // Billing State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);
    const [paymentDetails, setPaymentDetails] = useState<{ method: 'cash' | 'card'; tendered: number; change: number } | undefined>({ method: 'cash', tendered: 0, change: 0 });

    // Confirmation Modal State
    const [showClearConfirmation, setShowClearConfirmation] = useState(false);
    const [tableToClear, setTableToClear] = useState<string | null>(null);

    const handleClearTable = async () => {
        if (!tableToClear) return;
        try {
            await api.patch(`/tables/${tableToClear}/status`, { status: 'available' });
            toast.success('Table cleared');
            // Refresh tables
            const response = await api.get(`/tables?tenantId=${tenantId}`);
            const validTables = response.data.filter((t: Table) =>
                (t.status === 'available' || t.status === 'occupied') &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.id)
            );
            setTables(validTables);
            if (selectedTable === tableToClear) {
                setSelectedTable('');
            }
        } catch (error) {
            console.error('Failed to clear table', error);
            toast.error('Failed to clear table');
        }
    };

    const playSuccessSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'); // Simple "Cash Register" or "Ding" sound
        audio.play().catch(e => console.error('Error playing sound:', e));
    };

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

    const fetchTables = async () => {
        if (!token || !tenantId) return;
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

    useEffect(() => {
        if (token && tenantId) {
            fetchTables();
            // Fetch customers
            api.get(`/customers?tenantId=${tenantId}`)
                .then(res => setCustomers(res.data))
                .catch(err => console.error('Failed to fetch customers', err));

            // Fetch tenant details
            api.get(`/tenants/${tenantId}`)
                .then(res => setTenantDetails(res.data))
                .catch(err => console.error('Failed to fetch tenant details', err));
        }
    }, [token, tenantId]);

    const [redeemPoints, setRedeemPoints] = useState(0);

    // Reset points when customer changes
    useEffect(() => {
        setRedeemPoints(0);
    }, [selectedCustomer]);

    const calculateTotals = () => {
        const subtotal = total();
        const tax = subtotal * 0.1;
        const subtotalWithTax = subtotal + tax;

        let discountAmount = 0;
        if (discount.type === 'fixed') {
            discountAmount = discount.value;
        } else {
            discountAmount = subtotalWithTax * (discount.value / 100);
        }

        // Points Discount (1 Point = LKR 10.00)
        const pointsDiscount = redeemPoints * 10.00;
        discountAmount += pointsDiscount;

        const totalAfterDiscount = Math.max(0, subtotalWithTax - discountAmount);
        const serviceCharge = totalAfterDiscount * serviceChargeRate;
        const finalTotal = totalAfterDiscount + serviceCharge;

        return { subtotal, tax, discountAmount, pointsDiscount, serviceCharge, finalTotal };
    };

    const handlePaymentComplete = async (details: { method: 'cash' | 'card'; tendered: number; change: number }) => {
        setIsCheckingOut(true);
        try {
            // ... (existing validation logic)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const validItems = items.filter(item => uuidRegex.test(item.productId));

            // Only validate cart if we are NOT paying for a pending order
            const isPendingOrderPayment = lastOrder && lastOrder.status === 'pending';

            if (!isPendingOrderPayment && validItems.length === 0) {
                toast.error('Cart contained only invalid items and has been cleared.');
                clearCart();
                setShowPaymentModal(false);
                return;
            }

            const { finalTotal } = calculateTotals();

            if (lastOrder && lastOrder.status === 'pending') {
                // Paying for an existing pending order
                await api.patch(`/orders/${lastOrder.id}`, {
                    paymentStatus: 'PAID',
                    paymentMethod: details.method.toUpperCase()
                });

                // Update local state
                const updatedOrder = { ...lastOrder, paymentStatus: 'PAID', paymentMethod: details.method.toUpperCase() };
                setLastOrder(updatedOrder);

                // Remove from pending orders list
                setPendingOrders(prev => prev.filter(o => o.id !== lastOrder.id));
            } else {
                // Creating a new order
                const orderData = {
                    items: validItems.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price || 0
                    })),
                    tenantId,
                    tableId: orderType === 'dining' ? (selectedTable || undefined) : undefined,
                    orderType,
                    customerId: selectedCustomer?.id,
                    totalAmount: Number(finalTotal.toFixed(2)),
                    paymentMethod: details.method.toUpperCase(),
                    paymentStatus: 'PAID',
                    status: 'pending',
                    redeemedPoints: redeemPoints > 0 ? redeemPoints : undefined
                };

                const response = await api.post('/orders', orderData);
                setLastOrder(response.data);

                // Refresh tables to reflect locked status
                if (orderType === 'dining' && selectedTable) {
                    fetchTables();
                }

                // Update local customer state with new points
                if (response.data.customer) {
                    setCustomers(prev => prev.map(c =>
                        c.id === response.data.customer.id ? response.data.customer : c
                    ));
                    // If the selected customer is the one who just ordered, update them too
                    if (selectedCustomer && selectedCustomer.id === response.data.customer.id) {
                        setSelectedCustomer(response.data.customer);
                    }
                }
            }

            setPaymentDetails(details);
            setShowPaymentModal(false);
            setShowReceiptModal(true);
            playSuccessSound();

            // Don't clear cart yet if it was a new order, wait for "New Order" or modal close
            // But if it was a pending order, cart was already cleared.
            if (lastOrder && lastOrder.status === 'pending') {
                // Nothing to clear
            }


        } catch (error: any) {
            console.error('Failed to place order', error);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            toast.error(`Failed to place order: ${errorMessage}`);
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handleNewOrder = () => {
        clearCart();
        setSelectedTable('');
        setOrderType('dining');
        setSelectedCustomer(null);
        setRedeemPoints(0);
        setShowReceiptModal(false);
        setLastOrder(null);
    };

    const handleCreateCustomer = async (data: { name: string; phoneNumber: string; email: string }) => {
        if (!data.name.trim()) {
            toast.error('Customer name is required');
            return;
        }
        try {
            const response = await api.post('/customers', {
                name: data.name,
                phoneNumber: data.phoneNumber,
                email: data.email || '',
                tenantId
            });
            setSelectedCustomer(response.data);
            setCustomers([...customers, response.data]);
            toast.success('Customer created');
        } catch (error) {
            console.error('Failed to create customer', error);
            toast.error('Failed to create customer');
        }
    };

    const handleUpdateCustomer = async (data: { name: string; phoneNumber: string; email: string }) => {
        if (!selectedCustomer) return;
        if (!data.name.trim()) {
            toast.error('Customer name is required');
            return;
        }
        try {
            const response = await api.patch(`/customers/${selectedCustomer.id}`, {
                name: data.name,
                phoneNumber: data.phoneNumber,
                email: data.email || '',
            });
            setSelectedCustomer(response.data);
            setCustomers(customers.map(c => c.id === response.data.id ? response.data : c));
            toast.success('Customer updated');
        } catch (error) {
            console.error('Failed to update customer', error);
            toast.error('Failed to update customer');
        }
    };

    const handlePrintBill = async () => {
        if (items.length === 0) return;

        try {
            // 1. Create Pending Order
            const { finalTotal } = calculateTotals();
            const orderData = {
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price || 0
                })),
                tenantId,
                tableId: orderType === 'dining' ? (selectedTable || undefined) : undefined,
                orderType,
                customerId: selectedCustomer?.id,
                totalAmount: Number(finalTotal.toFixed(2)),
                paymentStatus: 'PENDING',
                status: 'pending',
                redeemedPoints: redeemPoints > 0 ? redeemPoints : undefined
            };

            const response = await api.post('/orders', orderData);
            const newOrder = response.data;
            setLastOrder(newOrder);

            // 2. Clear Cart
            clearCart();
            // Reset local states but keep table/customer if needed or reset them too?
            // User asked to clear items, usually implies resetting the "current order" context.
            // Let's reset order-specific state but maybe keep table selected if they want to add more?
            // "add karapu item clear wenna one" -> clear added items.
            // Let's fully reset for a clean slate like "New Order"
            setRedeemPoints(0);
            // We keep selectedTable and selectedCustomer for convenience or reset?
            // Usually printing bill means this "session" is done or paused.
            // Let's keep it simple and just clear items for now as requested.

            // 3. Print (using a timeout to ensure state updates and DOM rendering)
            setTimeout(() => {
                window.print();
            }, 100);

            toast.success('Order saved as Pending and Bill printed');

        } catch (error: any) {
            console.error('Failed to print bill', error);
            toast.error('Failed to save order for printing');
        }
    };

    const handleCheckoutClick = () => {
        if (orderType === 'dining' && !selectedTable) {
            toast.error('Please select a table for dining orders');
            return;
        }

        if (orderType === 'dining' && selectedTable) {
            const table = tables.find(t => t.id === selectedTable);
            if (table?.status === 'occupied') {
                toast.error('Table is occupied. Please clear it first.');
                return;
            }
        }

        const { finalTotal } = calculateTotals();
        if (finalTotal > 0) {
            setShowPaymentModal(true);
        } else {
            handlePaymentComplete({ method: 'cash', tendered: 0, change: 0 });
        }
    };

    const fetchPendingOrders = async () => {
        if (!token || !tenantId) return;
        try {
            const response = await api.get(`/orders?tenantId=${tenantId}&status=pending&paymentStatus=PENDING&_t=${Date.now()}`);
            setPendingOrders(response.data);
            setShowPendingOrders(true);
        } catch (error) {
            console.error('Failed to fetch pending orders', error);
            toast.error('Failed to fetch pending orders');
        }
    };



    return (
        <div className="flex flex-col h-full bg-white shadow-xl border-l border-gray-200 w-[400px]">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    Current Order
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={fetchPendingOrders}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Pending Orders"
                    >
                        <Clock size={20} />
                    </button>
                    <button
                        onClick={clearCart}
                        disabled={items.length === 0}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors p-2 hover:bg-red-50 rounded-lg"
                        title="Clear Cart"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Table & Order Type */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Table</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedTable}
                                onChange={(e) => setSelectedTable(e.target.value)}
                                disabled={orderType === 'takeaway'}
                                className={`flex-1 p-2 border rounded-lg text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${tables.find(t => t.id === selectedTable)?.status === 'occupied'
                                    ? 'bg-red-50 border-red-200 text-red-600'
                                    : 'bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary'
                                    }`}
                            >
                                <option value="">Select Table</option>
                                {tables.map(t => (
                                    <option
                                        key={t.id}
                                        value={t.id}
                                    >
                                        {t.name} {t.status === 'occupied' ? '(Occupied)' : ''}
                                    </option>
                                ))}
                            </select>
                            {selectedTable && tables.find(t => t.id === selectedTable)?.status === 'occupied' && (
                                <button
                                    onClick={() => {
                                        setTableToClear(selectedTable);
                                        setShowClearConfirmation(true);
                                    }}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-200 bg-white shadow-sm"
                                    title="Clear Table"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setOrderType('dining')}
                                className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${orderType === 'dining' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Dining
                            </button>
                            <button
                                onClick={() => {
                                    setOrderType('takeaway');
                                    setSelectedTable('');
                                }}
                                className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${orderType === 'takeaway' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Takeaway
                            </button>
                        </div>
                    </div>
                </div>

                {/* Customer Section */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Users size={16} className="text-primary" /> Customer
                        </span>
                        <button
                            onClick={() => {
                                setIsEditingCustomer(false);
                                setShowCustomerModal(true);
                            }}
                            className="text-xs text-primary font-bold hover:underline"
                        >
                            New Customer
                        </button>
                    </div>

                    {!selectedCustomer && (
                        <div className="relative mb-2">
                            <Search className="absolute left-2 top-2.5 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search by name or phone..."
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                className="w-full pl-8 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                            />
                            {customerSearch && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-40 overflow-y-auto">
                                    {customers
                                        .filter(c =>
                                            (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
                                            (c.phoneNumber || '').includes(customerSearch)
                                        )
                                        .map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    setSelectedCustomer(c);
                                                    setCustomerSearch('');
                                                }}
                                                className="w-full text-left p-2 hover:bg-gray-50 text-sm flex justify-between items-center"
                                            >
                                                <span>{c.name}</span>
                                                <span className="text-xs text-gray-400">{c.phoneNumber}</span>
                                            </button>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    )}

                    {selectedCustomer ? (
                        <div className="bg-white p-2 rounded border border-gray-200 mb-2 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-sm text-gray-800">{selectedCustomer.name}</p>
                                <p className="text-xs text-gray-500">{selectedCustomer.phoneNumber}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setIsEditingCustomer(true);
                                        setShowCustomerModal(true);
                                    }}
                                    className="text-xs text-blue-500 hover:underline"
                                >
                                    Edit
                                </button>
                                <button onClick={() => setSelectedCustomer(null)} className="text-xs text-red-500 hover:underline">Change</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 italic mb-2">No customer selected</p>
                    )}
                    {selectedCustomer && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100 flex justify-between items-center">
                            <span className="text-sm text-blue-800 font-medium">Loyalty Points: {selectedCustomer.loyaltyPoints || 0}</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max={selectedCustomer.loyaltyPoints || 0}
                                    value={redeemPoints || ''}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        setRedeemPoints(Math.min(val, selectedCustomer.loyaltyPoints || 0));
                                    }}
                                    className="w-16 p-1 text-sm border rounded text-right"
                                    placeholder="0"
                                    disabled={!selectedCustomer.loyaltyPoints}
                                />
                                <span className="text-xs text-blue-600">Redeem</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="space-y-3">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <Armchair size={24} className="opacity-50" />
                            </div>
                            <p className="text-sm">Cart is empty</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.productId} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg group">
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium text-gray-800">{item.name}</span>
                                        <span className="font-bold text-gray-900">LKR {(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm">
                                            <button
                                                onClick={() => updateQuantity(item.productId, Math.max(0, item.quantity - 1))}
                                                className="p-1 hover:bg-gray-50 text-gray-600 rounded-l-lg transition-colors"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                className="p-1 hover:bg-gray-50 text-gray-600 rounded-r-lg transition-colors"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.productId)}
                                            className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Items */}
                {/* ... */}

            </div>

            {/* Footer / Totals */}
            <div className="p-4 bg-white border-t border-gray-200 shadow-lg">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>LKR {isMounted ? calculateTotals().subtotal.toFixed(2) : '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Tax (10%)</span>
                        <span>LKR {isMounted ? calculateTotals().tax.toFixed(2) : '0.00'}</span>
                    </div>
                    {calculateTotals().serviceCharge > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span>Service Charge</span>
                            <span>LKR {isMounted ? calculateTotals().serviceCharge.toFixed(2) : '0.00'}</span>
                        </div>
                    )}
                    {redeemPoints > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                            <span>Points Redeemed ({redeemPoints})</span>
                            <span>-LKR {isMounted ? calculateTotals().pointsDiscount.toFixed(2) : '0.00'}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-dashed border-gray-300">
                        <span>Total</span>
                        <span>LKR {isMounted ? calculateTotals().finalTotal.toFixed(2) : '0.00'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handlePrintBill}
                        disabled={isCheckingOut || items.length === 0}
                        className="px-4 py-3 rounded-lg border border-blue-200 text-blue-600 font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                        Print Bill
                    </button>
                    <button
                        onClick={handleCheckoutClick}
                        disabled={isCheckingOut || items.length === 0}
                        className="px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none"
                    >
                        {isCheckingOut ? 'Processing...' : 'Pay Now'}
                    </button>
                </div>
            </div>
            {/* Pending Orders Modal */}
            {showPendingOrders && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Pending Orders</h3>
                            <button onClick={() => setShowPendingOrders(false)} className="text-gray-500 hover:text-gray-700">
                                <Trash2 size={20} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-4 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by customer or table..."
                                    value={pendingOrderSearch}
                                    onChange={(e) => setPendingOrderSearch(e.target.value)}
                                    className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {pendingOrders.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No pending orders found</div>
                            ) : (
                                pendingOrders
                                    .filter(order =>
                                        (order.customer?.name || '').toLowerCase().includes(pendingOrderSearch.toLowerCase()) ||
                                        (order.table?.name || '').toLowerCase().includes(pendingOrderSearch.toLowerCase()) ||
                                        (order.orderNumber || '').includes(pendingOrderSearch)
                                    )
                                    .map(order => (
                                        <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-800">#{order.orderNumber}</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.orderType === 'dining' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                        {order.orderType.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {order.table && <span className="mr-3">Table: {order.table.name}</span>}
                                                    {order.customer && <span>Customer: {order.customer.name}</span>}
                                                    {!order.table && !order.customer && <span>Walk-in Customer</span>}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {new Date(order.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-lg">LKR {Number(order.totalAmount).toFixed(2)}</span>
                                                <button
                                                    onClick={() => {
                                                        setLastOrder(order);
                                                        // Populate cart for display (optional, or just go straight to payment)
                                                        // For now, let's just set lastOrder and open payment modal
                                                        setShowPendingOrders(false);
                                                        setShowPaymentModal(true);
                                                    }}
                                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
                                                >
                                                    Pay
                                                </button>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <ReceiptModal
                isOpen={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                order={lastOrder}
                paymentDetails={paymentDetails!}
                tenantDetails={tenantDetails}
                onNewOrder={handleNewOrder}
                initialEmail={selectedCustomer?.email || ''}
            />

            <ConfirmationModal
                isOpen={showClearConfirmation}
                onClose={() => setShowClearConfirmation(false)}
                onConfirm={handleClearTable}
                title="Clear Table?"
                message={`Are you sure you want to clear ${tables.find(t => t.id === tableToClear)?.name || 'this table'}? This will make it available for new orders.`}
                confirmText="Yes, Clear Table"
                variant="danger"
            />
            <CustomerModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onSave={isEditingCustomer ? handleUpdateCustomer : handleCreateCustomer}
                initialName={isEditingCustomer ? selectedCustomer?.name : ''}
                initialPhoneNumber={isEditingCustomer ? selectedCustomer?.phoneNumber : ''}
                initialEmail={isEditingCustomer ? selectedCustomer?.email : ''}
                isEditing={isEditingCustomer}
            />
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                totalAmount={
                    (lastOrder && lastOrder.status === 'pending')
                        ? Number(lastOrder.totalAmount)
                        : Number(calculateTotals().finalTotal.toFixed(2))
                }
                onComplete={handlePaymentComplete}
            />

            {/* Printable Receipt Portal */}
            {isMounted && createPortal(
                <div id="printable-receipt" className="hidden print:block">
                    <div className="p-8 bg-white text-black font-mono text-sm max-w-[80mm] mx-auto">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold mb-2">{tenantDetails?.name || 'DINEXA POS'}</h1>
                            <p>{tenantDetails?.address || '123 Restaurant Street'}</p>
                            <p>Tel: {tenantDetails?.phoneNumber || '+1 234 567 890'}</p>
                            <div className="border-b-2 border-dashed border-black my-4"></div>
                        </div>

                        <div className="mb-4">
                            <p>Date: {new Date().toLocaleString()}</p>
                            <p>Order Type: {(lastOrder?.orderType || orderType).toUpperCase()}</p>
                            {(lastOrder?.table?.name || (selectedTable && tables.find(t => t.id === selectedTable)?.name)) && (
                                <p>Table: {lastOrder?.table?.name || tables.find(t => t.id === selectedTable)?.name}</p>
                            )}
                            {(lastOrder?.customer?.name || selectedCustomer?.name) && (
                                <p>Customer: {lastOrder?.customer?.name || selectedCustomer.name}</p>
                            )}
                        </div>

                        <div className="border-b border-dashed border-black mb-4"></div>

                        <div className="space-y-2 mb-4">
                            {(lastOrder?.items || items).map((item: any) => (
                                <div key={item.productId || item.id} className="flex justify-between">
                                    <span>{item.quantity}x {item.product?.name || item.name}</span>
                                    <span>LKR {((item.price || item.product?.price) * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-b border-dashed border-black mb-4"></div>

                        <div className="space-y-1 text-right">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>LKR {lastOrder ? Number(lastOrder.totalAmount / 1.1).toFixed(2) : calculateTotals().subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax (10%):</span>
                                <span>LKR {lastOrder ? Number(lastOrder.totalAmount - (lastOrder.totalAmount / 1.1)).toFixed(2) : calculateTotals().tax.toFixed(2)}</span>
                            </div>
                            {(lastOrder?.serviceCharge > 0 || calculateTotals().serviceCharge > 0) && (
                                <div className="flex justify-between">
                                    <span>Service Charge:</span>
                                    <span>LKR {lastOrder ? Number(lastOrder.serviceCharge).toFixed(2) : calculateTotals().serviceCharge.toFixed(2)}</span>
                                </div>
                            )}
                            {(lastOrder?.redeemedPoints > 0 || redeemPoints > 0) && (
                                <div className="flex justify-between">
                                    <span>Points Redeemed:</span>
                                    <span>-LKR {lastOrder ? Number(lastOrder.discountAmount || 0).toFixed(2) : calculateTotals().pointsDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg mt-2 border-t border-dashed border-black pt-2">
                                <span>Total:</span>
                                <span>LKR {lastOrder ? Number(lastOrder.totalAmount).toFixed(2) : calculateTotals().finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="text-center mt-8">
                            <p>Thank you for dining with us!</p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div >
    );
}
