import React, { useState } from 'react';
import { CheckCircle, Printer, Plus, Mail, Send } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    paymentDetails?: {
        method: 'cash' | 'card';
        tendered: number;
        change: number;
    };
    tenantDetails?: {
        name: string;
        address: string;
        phone: string;
    };
    onNewOrder: () => void;
    initialEmail?: string;
}

export function ReceiptModal({ isOpen, onClose, order, paymentDetails, tenantDetails, onNewOrder, initialEmail = '' }: ReceiptModalProps) {
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // Reset state when modal opens or order changes
    React.useEffect(() => {
        if (isOpen) {
            setEmail(initialEmail);
            setEmailSent(false);
            setIsSending(false);
        }
    }, [isOpen, order?.id, initialEmail]);

    if (!isOpen || !order) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleSendEmail = async () => {
        if (!email) {
            toast.error('Please enter an email address');
            return;
        }

        setIsSending(true);
        try {
            await api.post('/notifications/receipt', {
                email,
                order: {
                    ...order,
                    paymentMethod: paymentDetails?.method?.toUpperCase() || order.paymentMethod || 'PENDING',
                }
            });
            toast.success('Receipt sent to ' + email);
            setEmailSent(true);
        } catch (error) {
            console.error('Failed to send email', error);
            toast.error('Failed to send receipt');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:bg-white print:fixed print:inset-0 print:z-[100] p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl print:shadow-none print:w-full print:max-w-none print:rounded-none flex flex-col max-h-[90vh]">
                {/* Success Header (Hidden in Print) */}
                {paymentDetails && (
                    <div className="bg-green-50 p-6 text-center border-b border-green-100 print:hidden">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-800">Payment Successful!</h2>
                        <p className="text-green-600">Change Due: <span className="font-bold">LKR {paymentDetails.change.toFixed(2)}</span></p>
                    </div>
                )}

                {/* Bill Header (Hidden in Print, visible only if no payment details) */}
                {!paymentDetails && (
                    <div className="bg-blue-50 p-6 text-center border-b border-blue-100 print:hidden">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Printer size={32} className="text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-blue-800">Proforma Invoice</h2>
                        <p className="text-blue-600">Print this bill for the customer</p>
                    </div>
                )}

                {/* Receipt Content */}
                <div className="p-8 print:p-0 overflow-y-auto flex-1" id="receipt-content">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">{tenantDetails?.name || 'My Restaurant'}</h1>
                        <p className="text-sm text-gray-500">{tenantDetails?.address || '123 Food Street, Tasty City'}</p>
                        <p className="text-sm text-gray-500">Tel: {tenantDetails?.phone || '+1 234 567 890'}</p>
                    </div>

                    <div className="border-b-2 border-dashed border-gray-200 pb-4 mb-4 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Order #:</span>
                            <span className="font-mono font-bold">{order.orderNumber || `#${order.id?.slice(0, 8)}`}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Date:</span>
                            <span>{new Date().toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Cashier:</span>
                            <span>John Doe</span> {/* TODO: Get from auth */}
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        {order.items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                                <span className="flex-1">
                                    <span className="font-bold mr-2">{item.quantity}x</span>
                                    {item.name}
                                </span>
                                <span className="font-medium">LKR {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t-2 border-dashed border-gray-200 pt-4 space-y-2 mb-6">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>LKR {Number(order.totalAmount / 1.1).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Tax (10%)</span>
                            <span>LKR {Number(order.totalAmount - (order.totalAmount / 1.1)).toFixed(2)}</span>
                        </div>
                        {order.discount && (
                            <div className="flex justify-between text-orange-600 font-medium">
                                <span>Discount ({order.discount.type === 'fixed' ? 'LKR ' : ''}{order.discount.value}{order.discount.type === 'percentage' ? '%' : ''})</span>
                                <span>-LKR {Number(order.discountAmount || 0).toFixed(2)}</span>
                            </div>
                        )}
                        {order.serviceCharge > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Service Charge</span>
                                <span>LKR {Number(order.serviceCharge).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold text-gray-900 pt-2">
                            <span>Total</span>
                            <span>LKR {Number(order.totalAmount).toFixed(2)}</span>
                        </div>
                    </div>

                    {paymentDetails && (
                        <div className="bg-gray-50 p-4 rounded-lg print:bg-transparent print:p-0 print:border print:border-gray-200">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Payment Method</span>
                                <span className="font-bold uppercase">{paymentDetails.method}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Tendered</span>
                                <span className="font-medium">LKR {paymentDetails.tendered.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Change</span>
                                <span className="font-bold">LKR {paymentDetails.change.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    <div className="text-center mt-8 text-sm text-gray-500">
                        <p>Thank you for dining with us!</p>
                        <p>{tenantDetails?.address || 'Please come again.'}</p>
                    </div>
                </div>

                {/* Email Section (Hidden in Print) */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 print:hidden">
                    {!emailSent ? (
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email receipt to..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <button
                                onClick={handleSendEmail}
                                disabled={isSending || !email}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSending ? 'Sending...' : <><Send size={16} /> Send</>}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-green-600 font-medium flex items-center justify-center gap-2">
                            <CheckCircle size={18} /> Receipt sent successfully!
                        </div>
                    )}
                </div>

                {/* Actions (Hidden in Print) */}
                <div className="p-6 border-t border-gray-100 flex gap-3 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <Printer size={20} /> {paymentDetails ? 'Print Receipt' : 'Print Bill'}
                    </button>
                    <button
                        onClick={onNewOrder}
                        className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={20} /> {paymentDetails ? 'New Order' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}
