import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const colors = {
        danger: {
            icon: 'text-red-600',
            bg: 'bg-red-50',
            button: 'bg-red-600 hover:bg-red-700',
            border: 'border-red-200'
        },
        warning: {
            icon: 'text-yellow-600',
            bg: 'bg-yellow-50',
            button: 'bg-yellow-600 hover:bg-yellow-700',
            border: 'border-yellow-200'
        },
        info: {
            icon: 'text-blue-600',
            bg: 'bg-blue-50',
            button: 'bg-blue-600 hover:bg-blue-700',
            border: 'border-blue-200'
        }
    };

    const style = colors[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className={`p-6 ${style.bg} border-b ${style.border} flex items-start gap-4`}>
                    <div className={`p-2 bg-white rounded-full shadow-sm ${style.icon}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-lg font-bold ${style.icon}`}>{title}</h3>
                        <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 bg-white flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-white font-bold rounded-lg shadow-lg shadow-red-200 transition-all transform active:scale-95 ${style.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
