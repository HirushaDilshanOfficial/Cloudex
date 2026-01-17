import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalAmount: number;
    onComplete: (paymentDetails: { method: 'cash' | 'card'; tendered: number; change: number }) => void;
}

export function PaymentModal({ isOpen, onClose, totalAmount, onComplete }: PaymentModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
    const [tenderedAmount, setTenderedAmount] = useState<string>('');
    const [change, setChange] = useState<number>(0);

    useEffect(() => {
        if (isOpen) {
            setPaymentMethod('cash');
            setTenderedAmount('');
            setChange(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const tendered = parseFloat(tenderedAmount) || 0;
        setChange(Math.max(0, tendered - totalAmount));
    }, [tenderedAmount, totalAmount]);

    if (!isOpen) return null;

    const handleQuickAmount = (amount: number) => {
        setTenderedAmount(amount.toString());
    };

    const handleComplete = () => {
        const tendered = parseFloat(tenderedAmount) || 0;
        if (paymentMethod === 'cash' && tendered < totalAmount) {
            toast.error(`Please tender at least LKR ${totalAmount.toFixed(2)}`);
            return;
        }
        onComplete({
            method: paymentMethod,
            tendered: paymentMethod === 'cash' ? tendered : totalAmount,
            change: paymentMethod === 'cash' ? change : 0,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex overflow-hidden shadow-2xl">
                {/* Left Side: Order Summary */}
                <div className="w-1/3 bg-gray-50 p-8 border-r border-gray-200 flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>LKR {(totalAmount / 1.1).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Tax (10%)</span>
                                <span>LKR {(totalAmount - (totalAmount / 1.1)).toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-300 pt-4 mt-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-bold text-gray-800">Total Due</span>
                                    <span className="text-4xl font-bold text-primary">LKR {totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-400 text-center">
                        Order ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </div>
                </div>

                {/* Right Side: Payment Controls */}
                <div className="w-2/3 p-8 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">Select Payment Method</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Payment Method Toggles */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            onClick={() => setPaymentMethod('cash')}
                            className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === 'cash'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                        >
                            <Banknote size={32} />
                            <span className="font-bold text-lg">Cash</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod('card')}
                            className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === 'card'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                        >
                            <CreditCard size={32} />
                            <span className="font-bold text-lg">Card / Digital</span>
                        </button>
                    </div>

                    {/* Cash Payment Controls */}
                    {paymentMethod === 'cash' && (
                        <div className="flex-1 flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Tendered</label>
                            <div className="relative mb-6">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                                <input
                                    type="number"
                                    value={tenderedAmount}
                                    onChange={(e) => setTenderedAmount(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 text-3xl font-bold border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="0.00"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleComplete();
                                        }
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-3 mb-8">
                                {[10, 20, 50, 100].map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => handleQuickAmount(amount)}
                                        className="py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
                                    >
                                        LKR {amount}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handleQuickAmount(totalAmount)}
                                    className="col-span-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
                                >
                                    Exact Amount (LKR {totalAmount.toFixed(2)})
                                </button>
                            </div>

                            <div className="mt-auto bg-green-50 p-4 rounded-xl border border-green-100 flex justify-between items-center">
                                <span className="text-green-800 font-medium">Change Due</span>
                                <span className="text-2xl font-bold text-green-700">LKR {change.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* Card Payment Message */}
                    {paymentMethod === 'card' && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                <CreditCard size={48} className="text-gray-400" />
                            </div>
                            <p className="text-lg font-medium text-gray-800">Waiting for terminal...</p>
                            <p className="text-sm">Please follow instructions on the card reader.</p>
                        </div>
                    )}

                    {/* Complete Button */}
                    <button
                        onClick={handleComplete}
                        className={`w-full mt-8 py-4 text-white text-xl font-bold rounded-xl transition-colors shadow-lg ${paymentMethod === 'cash' && (parseFloat(tenderedAmount) || 0) < totalAmount
                            ? 'bg-gray-400 hover:bg-gray-500'
                            : 'bg-primary hover:bg-primary/90 shadow-primary/25'
                            }`}
                    >
                        {paymentMethod === 'cash' ? 'Pay with Cash' : 'Pay with Card'}
                    </button>
                </div>
            </div>
        </div>
    );
}
