'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Save, TrendingUp, DollarSign, Calculator } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

interface Product {
    id: string;
    name: string;
    price: number;
}

interface Ingredient {
    id: string;
    name: string;
    unit: string;
    costPerUnit: number;
}

interface Recipe {
    id: string;
    product: Product;
    items: {
        ingredient: Ingredient;
        quantity: number;
    }[];
}

export default function RecipeManagerPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [recipeItems, setRecipeItems] = useState<{ ingredientId: string; quantity: number; unit: string }[]>([]);
    const token = useAuthStore((state) => state.token);
    const [tenantId, setTenantId] = useState<string>('');

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
        }
    }, [tenantId]);

    const fetchData = async () => {
        try {
            const [productsRes, ingredientsRes, recipesRes] = await Promise.all([
                axios.get(`http://localhost:3001/products?tenantId=${tenantId}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`http://localhost:3001/inventory/ingredients?tenantId=${tenantId}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`http://localhost:3001/recipes?tenantId=${tenantId}`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            setProducts(productsRes.data);
            setIngredients(ingredientsRes.data);
            setRecipes(recipesRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
    };

    const handleAddItem = () => {
        setRecipeItems([...recipeItems, { ingredientId: '', quantity: 0, unit: '' }]);
    };

    const handleSaveRecipe = async () => {
        // Validation
        if (!selectedProduct) {
            toast.error('Please select a product');
            return;
        }
        if (recipeItems.length === 0) {
            toast.error('Please add at least one ingredient');
            return;
        }

        const invalidItems = recipeItems.filter(item => !item.ingredientId || item.quantity <= 0 || !item.unit);
        if (invalidItems.length > 0) {
            toast.error('Please ensure all ingredients have a valid quantity and unit');
            return;
        }

        try {
            await axios.post('http://localhost:3001/recipes', {
                productId: selectedProduct,
                items: recipeItems,
                tenantId: tenantId,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Recipe saved successfully!');
            setRecipeItems([]);
            setSelectedProduct('');
            fetchData(); // Refresh list
        } catch (error) {
            console.error('Failed to save recipe', error);
            toast.error('Failed to save recipe');
        }
    };

    // Calculations
    const calculateRecipeCost = (items: { ingredientId: string; quantity: number }[]) => {
        return items.reduce((total, item) => {
            const ingredient = ingredients.find(i => i.id === item.ingredientId);
            return total + (ingredient ? (Number(ingredient.costPerUnit) * item.quantity) : 0);
        }, 0);
    };

    const currentProduct = products.find(p => p.id === selectedProduct);
    const estimatedCost = calculateRecipeCost(recipeItems);
    const sellingPrice = currentProduct ? Number(currentProduct.price) : 0;
    const profitMargin = sellingPrice - estimatedCost;
    const marginPercentage = sellingPrice > 0 ? (profitMargin / sellingPrice) * 100 : 0;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Recipe Manager</h1>
                    <p className="text-gray-500 mt-1">Manage recipes, track costs, and analyze profit margins</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Create Recipe Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Plus className="text-primary" size={24} /> Create New Recipe
                        </h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
                            <select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50"
                            >
                                <option value="">-- Choose a product --</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name} - LKR {Number(p.price).toFixed(2)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-4 mb-6">
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
                                <div key={index} className="flex gap-4 items-end bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">Ingredient</label>
                                        <select
                                            value={item.ingredientId}
                                            onChange={(e) => {
                                                const newItems = [...recipeItems];
                                                const selectedIngredient = ingredients.find(i => i.id === e.target.value);
                                                newItems[index].ingredientId = e.target.value;
                                                newItems[index].unit = selectedIngredient ? selectedIngredient.unit : '';
                                                setRecipeItems(newItems);
                                            }}
                                            className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                                        >
                                            <option value="">Select...</option>
                                            {ingredients.map((i) => (
                                                <option key={i.id} value={i.id}>{i.name} ({i.unit}) - LKR {Number(i.costPerUnit).toFixed(2)}/{i.unit}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                                        <input
                                            type="number"
                                            value={item.quantity || ''}
                                            onChange={(e) => {
                                                const newItems = [...recipeItems];
                                                const val = parseFloat(e.target.value);
                                                newItems[index].quantity = isNaN(val) ? 0 : val;
                                                setRecipeItems(newItems);
                                            }}
                                            className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleSaveRecipe}
                            disabled={!selectedProduct || recipeItems.length === 0}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            <Save size={20} />
                            <span>Save Recipe</span>
                        </button>
                    </div>
                </div>

                {/* Right Column: Real-time Cost Analysis */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Calculator className="text-blue-600" size={24} /> Cost Analysis
                        </h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Estimated Cost</p>
                                <p className="text-2xl font-bold text-gray-900">LKR {estimatedCost.toFixed(2)}</p>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Selling Price</p>
                                <p className="text-2xl font-bold text-gray-900">LKR {sellingPrice.toFixed(2)}</p>
                            </div>

                            <div className={`p-4 rounded-lg border ${profitMargin >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className={`text-sm font-medium mb-1 ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>Profit Margin</p>
                                        <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            LKR {profitMargin.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${profitMargin >= 0 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                        {marginPercentage.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Existing Recipes List */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Existing Recipes</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Product</th>
                                <th className="p-4 font-semibold text-gray-600">Ingredients</th>
                                <th className="p-4 font-semibold text-gray-600">Total Cost</th>
                                <th className="p-4 font-semibold text-gray-600">Selling Price</th>
                                <th className="p-4 font-semibold text-gray-600">Profit Margin</th>
                                <th className="p-4 font-semibold text-gray-600">Margin %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recipes.map((recipe) => {
                                const cost = recipe.items.reduce((sum, item) => sum + (Number(item.ingredient.costPerUnit) * item.quantity), 0);
                                const price = Number(recipe.product.price);
                                const margin = price - cost;
                                const percent = price > 0 ? (margin / price) * 100 : 0;

                                return (
                                    <tr key={recipe.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-900">{recipe.product.name}</td>
                                        <td className="p-4 text-gray-600">{recipe.items.length} items</td>
                                        <td className="p-4 text-gray-900">LKR {cost.toFixed(2)}</td>
                                        <td className="p-4 text-gray-900">LKR {price.toFixed(2)}</td>
                                        <td className={`p-4 font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            LKR {margin.toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${margin >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {percent.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {recipes.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No recipes found. Create one above!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
