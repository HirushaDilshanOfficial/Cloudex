'use client';

import React, { useState, useEffect } from 'react';
import { TenantLayout } from '@/components/tenant/tenant-layout';
import { Plus, Save } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';

interface Product {
    id: string;
    name: string;
}

interface Ingredient {
    id: string;
    name: string;
    unit: string;
}

export default function RecipeManagerPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [recipeItems, setRecipeItems] = useState<{ ingredientId: string; quantity: number }[]>([]);
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        // Fetch products and ingredients
        const fetchData = async () => {
            try {
                const [productsRes, ingredientsRes] = await Promise.all([
                    axios.get('http://localhost:3001/products?tenantId=default-tenant-id', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:3001/inventory/ingredients?tenantId=default-tenant-id', { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                setProducts(productsRes.data);
                setIngredients(ingredientsRes.data);
            } catch (error) {
                console.error('Failed to fetch data', error);
            }
        };
        fetchData();
    }, []);

    const handleAddItem = () => {
        setRecipeItems([...recipeItems, { ingredientId: '', quantity: 0 }]);
    };

    const handleSaveRecipe = async () => {
        if (!selectedProduct) return;
        try {
            await axios.post('http://localhost:3001/recipes', {
                productId: selectedProduct,
                items: recipeItems,
                tenantId: 'default-tenant-id',
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Recipe saved successfully!');
            setRecipeItems([]);
            setSelectedProduct('');
        } catch (error) {
            console.error('Failed to save recipe', error);
            alert('Failed to save recipe');
        }
    };

    return (
        <TenantLayout>
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Recipe Manager</h1>
                        <p className="text-gray-500">Link ingredients to products for auto-deduction</p>
                    </div>
                    <button
                        onClick={handleSaveRecipe}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Save size={20} />
                        <span>Save Recipe</span>
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">-- Choose a product --</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800">Ingredients</h3>
                            <button
                                onClick={handleAddItem}
                                className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                            >
                                <Plus size={16} /> Add Ingredient
                            </button>
                        </div>

                        {recipeItems.map((item, index) => (
                            <div key={index} className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">Ingredient</label>
                                    <select
                                        value={item.ingredientId}
                                        onChange={(e) => {
                                            const newItems = [...recipeItems];
                                            newItems[index].ingredientId = e.target.value;
                                            setRecipeItems(newItems);
                                        }}
                                        className="w-full p-2 rounded-lg border border-gray-200"
                                    >
                                        <option value="">Select...</option>
                                        {ingredients.map((i) => (
                                            <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const newItems = [...recipeItems];
                                            newItems[index].quantity = parseFloat(e.target.value);
                                            setRecipeItems(newItems);
                                        }}
                                        className="w-full p-2 rounded-lg border border-gray-200"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </TenantLayout>
    );
}
