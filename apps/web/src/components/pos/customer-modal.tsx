import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail } from 'lucide-react';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customer: { name: string; phoneNumber: string; email: string }) => Promise<void>;
    initialName?: string;
    initialPhoneNumber?: string;
    initialEmail?: string;
    isEditing?: boolean;
}

export function CustomerModal({ isOpen, onClose, onSave, initialName = '', initialPhoneNumber = '', initialEmail = '', isEditing = false }: CustomerModalProps) {
    const [name, setName] = useState(initialName);
    const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
    const [email, setEmail] = useState(initialEmail);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setPhoneNumber(initialPhoneNumber);
            setEmail(initialEmail);
        }
    }, [isOpen, initialName, initialPhoneNumber, initialEmail]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phoneNumber.trim()) return;

        setIsLoading(true);
        try {
            await onSave({ name, phoneNumber, email });
            onClose();
        } catch (error) {
            console.error('Failed to save customer', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">{isEditing ? 'Edit Customer' : 'Create New Customer'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="Enter name"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="Enter phone number"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="Enter email address"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : (
                                <>
                                    <Save size={18} />
                                    {isEditing ? 'Update Customer' : 'Save Customer'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
