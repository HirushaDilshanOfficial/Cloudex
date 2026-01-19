import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, PlayCircle, XCircle, RotateCcw } from 'lucide-react';
import { differenceInSeconds, formatDistanceToNow } from 'date-fns';

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
    notes?: string;
}

interface OrderCardProps {
    order: Order;
    onStatusUpdate: (orderId: string, status: string) => void;
    onCancel: (orderId: string) => void;
    isHistory?: boolean;
    onUndo?: (orderId: string) => void;
}

export function OrderCard({ order, onStatusUpdate, onCancel, isHistory, onUndo }: OrderCardProps) {
    const [elapsedTime, setElapsedTime] = useState('00:00');
    const [timerColor, setTimerColor] = useState('text-gray-400');

    useEffect(() => {
        if (isHistory) {
            setElapsedTime(formatDistanceToNow(new Date(order.updatedAt), { addSuffix: true }));
            return;
        }

        const interval = setInterval(() => {
            const now = new Date();
            const created = new Date(order.createdAt);
            const diffSecs = differenceInSeconds(now, created);
            const mins = Math.floor(diffSecs / 60);
            const secs = diffSecs % 60;

            setElapsedTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);

            // Color logic
            if (mins < 5) setTimerColor('text-emerald-400'); // Fresh
            else if (mins < 15) setTimerColor('text-yellow-400'); // Warning
            else setTimerColor('text-red-400 animate-pulse'); // Critical
        }, 1000);

        return () => clearInterval(interval);
    }, [order.createdAt, order.updatedAt, isHistory]);

    const statusColors = {
        pending: 'border-l-blue-500 bg-blue-500/10',
        preparing: 'border-l-orange-500 bg-orange-500/10',
        ready: 'border-l-green-500 bg-green-500/10',
        completed: 'border-l-gray-500 bg-gray-500/10 grayscale',
        cancelled: 'border-l-red-500 bg-red-500/10 grayscale'
    };

    const statusBadgeColors = {
        pending: 'bg-blue-500 text-white',
        preparing: 'bg-orange-500 text-white',
        ready: 'bg-green-500 text-white',
        completed: 'bg-gray-500 text-white',
        cancelled: 'bg-red-500 text-white'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`
                relative flex flex-col h-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl
                ${order.status === 'preparing' && !isHistory ? 'ring-1 ring-orange-500/30' : ''}
                ${isHistory ? 'opacity-90' : ''}
            `}
        >
            {/* Status Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusColors[order.status]?.split(' ')[0].replace('border-l-', 'bg-') || 'bg-gray-500'}`} />

            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-start bg-gray-900/50">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold text-white tracking-tight">#{order.orderNumber || order.id.slice(-4)}</span>
                        {order.orderType && (
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${order.orderType === 'takeaway' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                {order.orderType}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono font-medium">
                        <Clock size={12} className={isHistory ? 'text-gray-500' : timerColor} />
                        <span className={isHistory ? 'text-gray-400' : timerColor}>{isHistory ? `Ended ${elapsedTime}` : elapsedTime}</span>
                        {!isHistory && (
                            <>
                                <span className="text-gray-600">|</span>
                                <span className="text-gray-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-lg ${statusBadgeColors[order.status] || 'bg-gray-500 text-white'}`}>
                    {order.status}
                </div>
            </div>

            {/* Items */}
            <div className="flex-1 p-4 overflow-y-auto min-h-[160px] bg-gray-900/30">
                <ul className="space-y-3">
                    {order.items.map((item, index) => (
                        <li key={index} className="flex justify-between items-start group">
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-white/5 text-white font-bold text-sm border border-white/10 group-hover:border-white/20 group-hover:bg-white/10 transition-colors">
                                    {item.quantity}
                                </span>
                                <span className={`text-gray-200 font-medium leading-6 ${isHistory ? 'line-through text-gray-500' : ''}`}>{item.product.name}</span>
                            </div>
                        </li>
                    ))}
                </ul>
                {order.notes && (
                    <div className="mt-4 pt-3 border-t border-dashed border-gray-700">
                        <p className="text-xs text-amber-400 italic">Note: {order.notes}</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-3 bg-gray-900/80 border-t border-gray-800 backdrop-blur-sm">
                <div className="flex gap-2">
                    {isHistory ? (
                        <button
                            onClick={() => onUndo?.(order.id)}
                            className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 shadow-lg"
                        >
                            <RotateCcw size={18} /> Undo Completion
                        </button>
                    ) : (
                        <>
                            {order.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => onCancel(order.id)}
                                        className="p-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200 border border-red-500/20"
                                        title="Cancel"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                    <button
                                        onClick={() => onStatusUpdate(order.id, 'preparing')}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-900/20 transition-all duration-200"
                                    >
                                        <PlayCircle size={18} /> Start
                                    </button>
                                </>
                            )}
                            {order.status === 'preparing' && (
                                <button
                                    onClick={() => onStatusUpdate(order.id, 'ready')}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-900/20 transition-all duration-200"
                                >
                                    <CheckCircle size={18} /> Ready
                                </button>
                            )}
                            {/* Support ready -> completed transition if needed, though mostly handled by modal now. 
                                 Can keep a button here just in case or rely on 'Ready' being final step on KDS active view.
                                 Let's allow 'Ready' orders to be 'Completed' via button too.
                             */}
                            {order.status === 'ready' && (
                                <button
                                    onClick={() => onStatusUpdate(order.id, 'completed')}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-900/20 transition-all duration-200 animate-pulse"
                                >
                                    <CheckCircle size={18} /> Complete
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
