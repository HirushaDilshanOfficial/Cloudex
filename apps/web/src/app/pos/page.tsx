'use client';

import React from 'react';
import { PosLayout } from '@/components/pos/pos-layout';
import { ProductCard } from '@/components/pos/product-card';
import { CartSidebar } from '@/components/pos/cart-sidebar';

import { useSync } from '@/hooks/use-sync';

// Mock data for development
const MOCK_PRODUCTS = [
    { id: '1', name: 'Classic Burger', price: 8.99, category: 'Burgers' },
    { id: '2', name: 'Cheese Pizza', price: 12.50, category: 'Pizza' },
    { id: '3', name: 'French Fries', price: 3.99, category: 'Sides' },
    { id: '4', name: 'Coca Cola', price: 1.99, category: 'Drinks' },
    { id: '5', name: 'Chicken Wings', price: 9.99, category: 'Starters' },
    { id: '6', name: 'Caesar Salad', price: 7.50, category: 'Salads' },
];

export default function POSPage() {
    // TODO: Get tenantId from auth context
    useSync('default-tenant-id');

    return (
        <PosLayout sidebar={<CartSidebar />}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Menu</h1>
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {['All', 'Burgers', 'Pizza', 'Sides', 'Drinks', 'Starters', 'Salads'].map((cat) => (
                        <button
                            key={cat}
                            className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-primary hover:text-white hover:border-primary transition-all whitespace-nowrap"
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {MOCK_PRODUCTS.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </PosLayout>
    );
}
