'use client';

import React, { useState, useEffect } from 'react';
import { generateReport } from '@/lib/report-generator';
import { Plus, Search, Edit, Trash2, Image as ImageIcon, X, AlertTriangle, List, Upload, Download } from 'lucide-react';

import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    isAvailable: boolean;
}

interface Category {
    id: string;
    name: string;
}

export default function MenuPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        imageUrl: '',
        isAvailable: true,
    });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const token = useAuthStore((state) => state.token);
    const [tenantId, setTenantId] = useState<string>('');

    // Category State
    const [categories, setCategories] = useState<Category[]>([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Delete State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);

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
        if (tenantId) {
            fetchData();
            fetchCategories();
        }
    }, [tenantId]);

    const fetchData = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/products?tenantId=${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/categories?tenantId=${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const handleOpenCreate = () => {
        setSelectedProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            category: '',
            imageUrl: '',
            isAvailable: true,
        });
        setImageFile(null);
        setShowModal(true);
    };

    const handleOpenEdit = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            category: product.category,
            imageUrl: product.imageUrl || '',
            isAvailable: product.isAvailable,
        });
        setImageFile(null);
        setShowModal(true);
    };

    const handleSubmit = async () => {
        try {
            // Use existing imageUrl or the one from formData
            // Note: Image upload logic removed as CloudinaryService is not available
            const imageUrl = formData.imageUrl;

            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                imageUrl,
                tenantId,
            };

            if (selectedProduct) {
                await axios.patch(`http://localhost:3001/products/${selectedProduct.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Product updated successfully');
            } else {
                await axios.post('http://localhost:3001/products', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Product created successfully');
            }

            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save product', error);
            toast.error('Failed to save product');
        }
    };

    const confirmDelete = (id: string) => {
        setProductToDelete(id);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!productToDelete) return;
        try {
            await axios.delete(`http://localhost:3001/products/${productToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Product deleted successfully');
            fetchData();
            setShowDeleteModal(false);
            setProductToDelete(null);
        } catch (error) {
            console.error('Failed to delete product', error);
            toast.error('Failed to delete product');
        }
    };

    // Category Handlers
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            await axios.post(`http://localhost:3001/categories`, {
                name: newCategoryName,
                tenantId
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Category added');
            setNewCategoryName('');
            fetchCategories();
        } catch (error) {
            toast.error('Failed to add category');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Delete this category?')) return;
        try {
            await axios.delete(`http://localhost:3001/categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Category deleted');
            fetchCategories();
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    const handleLoadDefaults = async () => {
        try {
            await axios.post(`http://localhost:3001/categories/seed-defaults`, { tenantId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Default categories loaded');
            fetchCategories();
        } catch (error) {
            toast.error('Failed to load defaults');
        }
    };

    const handleDownloadReport = () => {
        const columns = ['Product Name', 'Category', 'Price', 'Status'];
        const data = products.map(product => [
            product.name,
            product.category,
            `LKR ${Number(product.price).toFixed(2)}`,
            product.isAvailable ? 'Available' : 'Unavailable'
        ]);

        generateReport({
            title: 'Menu Report',
            columns,
            data,
            filename: 'menu_report',
            tenantId,
            token: token || ''
        });
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Menu Management</h1>
                    <p className="text-gray-500">Manage your restaurant's menu items</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadReport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Download size={20} />
                        <span>Download Menu</span>
                    </button>
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <List size={20} />
                        <span>Categories</span>
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={20} />
                        <span>Add Product</span>
                    </button>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h2 className="text-xl font-bold text-gray-800">{selectedProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Classic Burger"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Product description..."
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (LKR)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={formData.price}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (val >= 0 || e.target.value === '') {
                                                setFormData({ ...formData, price: e.target.value });
                                            }
                                        }}
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setImageFile(file);
                                        }}
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        {imageFile ? (
                                            <>
                                                <ImageIcon className="text-primary" size={32} />
                                                <span className="text-sm text-gray-600 font-medium">{imageFile.name}</span>
                                            </>
                                        ) : formData.imageUrl ? (
                                            <>
                                                <img src={formData.imageUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg mb-2" />
                                                <span className="text-sm text-gray-500">Click to change image</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="text-gray-400" size={32} />
                                                <span className="text-sm text-gray-500">Click to upload image</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <input
                                    type="checkbox"
                                    id="isAvailable"
                                    checked={formData.isAvailable}
                                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                    className="rounded text-primary focus:ring-primary w-4 h-4"
                                />
                                <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Available for sale</label>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                            >
                                {selectedProduct ? 'Update Product' : 'Create Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="text-red-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Product?</h3>
                            <p className="text-gray-500 mb-6">
                                Are you sure you want to delete this product? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Management Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">Manage Categories</h2>
                            <button onClick={() => setShowCategoryModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="New category name..."
                                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <button
                                    onClick={handleAddCategory}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {categories.map((cat) => (
                                    <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium text-gray-700">{cat.name}</span>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {categories.length === 0 && (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500 mb-2">No categories found.</p>
                                        <button
                                            onClick={handleLoadDefaults}
                                            className="text-primary hover:underline text-sm font-medium"
                                        >
                                            Load Default Categories
                                        </button>
                                    </div>
                                )}
                            </div>
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
                                <td className="px-6 py-4 font-bold text-gray-800">LKR {Number(product.price).toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    {product.isAvailable ? (
                                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Available</span>
                                    ) : (
                                        <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">Unavailable</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button
                                        onClick={() => handleOpenEdit(product)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(product.id)}
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
        </>
    );
}
