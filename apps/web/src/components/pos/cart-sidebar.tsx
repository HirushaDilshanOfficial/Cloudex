import React from 'react';
import { useCartStore } from '@/store/cart-store';
import { Trash2, Minus, Plus, Armchair, CheckCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { PaymentModal } from './payment-modal';
import { ReceiptModal } from './receipt-modal';

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

            // Fetch tenant details
            api.get(`/tenants/${tenantId}`)
                .then(res => setTenantDetails(res.data))
                .catch(err => console.error('Failed to fetch tenant details', err));
        }
    }, [token, tenantId]);

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

        const totalAfterDiscount = Math.max(0, subtotalWithTax - discountAmount);
        const serviceCharge = totalAfterDiscount * serviceChargeRate;
        const finalTotal = totalAfterDiscount + serviceCharge;

        return { subtotal, tax, discountAmount, serviceCharge, finalTotal };
    };

    const handlePaymentComplete = async (details: { method: 'cash' | 'card'; tendered: number; change: number }) => {
        setIsCheckingOut(true);
        try {
            // Filter out invalid items (self-healing)
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
                    status: 'completed',
                    paymentMethod: details.method.toUpperCase()
                });

                // Update local state
                const updatedOrder = { ...lastOrder, status: 'completed', paymentMethod: details.method.toUpperCase() };
                setLastOrder(updatedOrder);
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
                    status: 'completed'
                };

                const response = await api.post('/orders', orderData);
                setLastOrder(response.data);
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
        setShowReceiptModal(false);
        setLastOrder(null);
    };

    const handlePrintBill = async () => {
        // Filter out invalid items (self-healing)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validItems = items.filter(item => uuidRegex.test(item.productId));

        if (validItems.length === 0) {
            toast.error('Cart is empty or contains invalid items.');
            return;
        }

        const { finalTotal } = calculateTotals();

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
            paymentMethod: 'CASH', // Default for pending, will be updated on payment
            status: 'pending' // Explicitly pending
        };

        try {
            const response = await api.post('/orders', orderData);
            const savedOrder = response.data;

            // Add discount info for display if needed (backend doesn't store it yet, but we can show it on this receipt)
            savedOrder.discount = discount.value > 0 ? discount : undefined;
            savedOrder.serviceCharge = serviceChargeRate > 0 ? (finalTotal / (1 + serviceChargeRate)) * serviceChargeRate : 0;

            setLastOrder(savedOrder);
            setPaymentDetails(undefined as any); // Clear payment details for Proforma mode
            setShowReceiptModal(true);

            // Clear cart after saving
            clearCart();
            toast.success('Order saved as Pending');
        } catch (error) {
            console.error('Failed to save pending order', error);
            toast.error('Failed to save order');
        }
    };

    const handleCheckoutClick = () => {
        // Filter out invalid items (self-healing)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validItems = items.filter(item => uuidRegex.test(item.productId));

        if (validItems.length === 0) {
            toast.error('Cart contained only invalid items and has been cleared.');
            clearCart();
            return;
        }

        setLastOrder(null); // Ensure we are starting a fresh order
        setShowPaymentModal(true);
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
                            {orderType === 'dining' && tables.length === 0 && (
                                <option value="" disabled>No tables found for this branch</option>
                            )}
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

                {/* Pending Orders Button */}
                <button
                    onClick={() => {
                        setShowPendingOrders(true);
                        // Fetch pending orders
                        api.get(`/orders?tenantId=${tenantId}`) // We need to filter by status=pending in frontend or backend
                            .then(res => {
                                const pending = res.data.filter((o: any) => o.status === 'pending');
                                setPendingOrders(pending);
                            })
                            .catch(err => console.error('Failed to fetch orders', err));
                    }}
                    className="mt-2 w-full py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm font-medium hover:bg-yellow-100 flex items-center justify-center gap-2"
                >
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    View Pending Orders
                </button>
            </div>

            {/* Pending Orders Modal */}
            {
                showPendingOrders && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                            <div className="p-4 border-b bg-gray-50 rounded-t-xl">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-lg">Pending Orders</h3>
                                    <button onClick={() => setShowPendingOrders(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by Order # or Amount..."
                                    value={pendingOrderSearch}
                                    onChange={(e) => setPendingOrderSearch(e.target.value)}
                                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div className="p-4 overflow-y-auto flex-1">
                                {pendingOrders.filter(order =>
                                    (order.orderNumber?.toLowerCase() || '').includes(pendingOrderSearch.toLowerCase()) ||
                                    (order.totalAmount?.toString() || '').includes(pendingOrderSearch)
                                ).length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No matching pending orders found.</p>
                                ) : (
                                    <div className="grid gap-4">
                                        {pendingOrders
                                            .filter(order =>
                                                (order.orderNumber?.toLowerCase() || '').includes(pendingOrderSearch.toLowerCase()) ||
                                                (order.totalAmount?.toString() || '').includes(pendingOrderSearch)
                                            )
                                            .map(order => (
                                                <div key={order.id} className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-lg">{order.orderNumber}</span>
                                                            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full uppercase font-bold">Pending</span>
                                                        </div>
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(order.createdAt).toLocaleString()} • {order.items?.length} Items
                                                        </p>
                                                        <p className="text-sm font-medium text-gray-800 mt-1">
                                                            Total: ${Number(order.totalAmount).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setLastOrder(order);
                                                            setShowPendingOrders(false);
                                                            setShowPaymentModal(true);
                                                            // We need to update handlePaymentComplete to handle existing order payment
                                                        }}
                                                        className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                                                    >
                                                        Pay Now
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

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
                        <span>${isMounted ? calculateTotals().subtotal.toFixed(2) : '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Tax (10%)</span>
                        <span>${isMounted ? calculateTotals().tax.toFixed(2) : '0.00'}</span>
                    </div>

                    {/* Discount Section */}
                    {showDiscountInput ? (
                        <div className="bg-orange-50 p-2 rounded border border-orange-100 mb-2">
                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={() => setDiscount({ ...discount, type: 'fixed' })}
                                    className={`flex-1 text-xs py-1 rounded ${discount.type === 'fixed' ? 'bg-orange-200 font-bold' : 'bg-white border'}`}
                                >
                                    $ Fixed
                                </button>
                                <button
                                    onClick={() => setDiscount({ ...discount, type: 'percentage' })}
                                    className={`flex-1 text-xs py-1 rounded ${discount.type === 'percentage' ? 'bg-orange-200 font-bold' : 'bg-white border'}`}
                                >
                                    % Percent
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={discount.value || ''}
                                    onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                                    className="flex-1 p-1 text-sm border rounded"
                                    placeholder={discount.type === 'fixed' ? 'Amount ($)' : 'Percentage (%)'}
                                />
                                <button onClick={() => setShowDiscountInput(false)} className="text-xs text-gray-500 underline">Close</button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowDiscountInput(true)}
                            className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                        >
                            <Plus size={14} /> Add Discount
                        </button>
                    )}

                    {discount.value > 0 && (
                        <div className="flex justify-between text-orange-600 font-medium">
                            <span>Discount ({discount.type === 'fixed' ? '$' : ''}{discount.value}{discount.type === 'percentage' ? '%' : ''})</span>
                            <span>-${isMounted ? calculateTotals().discountAmount.toFixed(2) : '0.00'}</span>
                        </div>
                    )}

                    {serviceChargeRate > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span>Service Charge (10%)</span>
                            <span>${isMounted ? calculateTotals().serviceCharge.toFixed(2) : '0.00'}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={serviceChargeRate > 0}
                                onChange={(e) => setServiceChargeRate(e.target.checked ? 0.10 : 0)}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            Apply Service Charge (10%)
                        </label>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-dashed border-gray-300">
                        <span>Total</span>
                        <span>${isMounted ? calculateTotals().finalTotal.toFixed(2) : '0.00'}</span>
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
            {/* Modals */}
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

            <ReceiptModal
                isOpen={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                order={lastOrder}
                paymentDetails={paymentDetails!}
                tenantDetails={tenantDetails}
                onNewOrder={handleNewOrder}
            />
        </div >
    );
}
