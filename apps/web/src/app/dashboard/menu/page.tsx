'use client';

import React, { useState, useEffect } from 'react';
import { TenantLayout } from '@/components/tenant/tenant-layout';
import { Plus, Search, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    isAvailable: boolean;
    imageUrl?: string;
}

export default function MenuPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const token = useAuthStore((state) => state.token);
    const [tenantId, setTenantId] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: 0,
        category: 'Main Course',
        isAvailable: true,
        imageUrl: ''
    });

    useEffect(() => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setTenantId(decoded.tenantId);
            } catch (error) {
                console.error('Invalid token', error);
            }
        }
    }, [token]);

    useEffect(() => {
        if (token && tenantId) {
            fetchProducts();
        }
    }, [token, tenantId]);

    const fetchProducts = async () => {
        try {
            const response = await api.get(`/products?tenantId=${tenantId}`);
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await api.post('/products', {
                ...newProduct,
                tenantId,
            });
            setShowModal(false);
            setNewProduct({
                name: '',
                description: '',
                price: 0,
                category: 'Main Course',
                isAvailable: true,
                imageUrl: ''
            });
            fetchProducts();
            toast.success('Product created successfully!');
        } catch (error: any) {
            console.error('Failed to create product', error);
            toast.error(`Failed to create product: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
            toast.success('Product deleted successfully');
        } catch (error: any) {
            console.error('Failed to delete product', error);
            toast.error(`Failed to delete product: ${error.response?.data?.message || error.message}`);
        }
    };

    return (
        <TenantLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Menu Management</h1>
                    <p className="text-gray-500">Manage your restaurant's menu items</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Product</span>
                </button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Add New Product</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    placeholder="e.g. Classic Burger"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full p-2 border rounded-lg"
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="Product description..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full p-2 border rounded-lg"
                                        value={newProduct.price}
                                        onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                    >
                                        <option value="Main Course">Main Course</option>
                                        <option value="Appetizer">Appetizer</option>
                                        <option value="Dessert">Dessert</option>
                                        <option value="Beverage">Beverage</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={newProduct.imageUrl}
                                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isAvailable"
                                    checked={newProduct.isAvailable}
                                    onChange={(e) => setNewProduct({ ...newProduct, isAvailable: e.target.checked })}
                                    className="rounded text-primary focus:ring-primary"
                                />
                                <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">Available for sale</label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                            >
                                Create Product
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search menu..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500">Image</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Name</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Category</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Price</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                            <ImageIcon size={20} />
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    <div>
                                        {product.name}
                                        <p className="text-xs text-gray-500 font-normal truncate max-w-[200px]">{product.description}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{product.category}</td>
                                <td className="px-6 py-4 font-bold text-gray-800">${Number(product.price).toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    {product.isAvailable ? (
                                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Available</span>
                                    ) : (
                                        <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">Unavailable</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No products found. Add some to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </TenantLayout>
    );
}
