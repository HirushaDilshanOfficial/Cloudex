import React from 'react';
import { useCartStore } from '@/store/cart-store';
import { Trash2, Minus, Plus } from 'lucide-react';

export function CartSidebar() {
    const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
                <p className="text-sm text-gray-500">{items.length} items</p>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {items.length === 0 ? (
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
                        <span>${total().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Tax (10%)</span>
                        <span>${(total() * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-dashed border-gray-300">
                        <span>Total</span>
                        <span>${(total() * 1.1).toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={clearCart}
                        className="px-4 py-3 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button className="px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
                        Pay Now
                    </button>
                </div>
            </div>
        </div>
    );
}
