'use client';

import React from 'react';
import { PosLayout } from '@/components/pos/pos-layout';
import { ProductCard } from '@/components/pos/product-card';
import { CartSidebar } from '@/components/pos/cart-sidebar';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

import { useSync } from '@/hooks/use-sync';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { jwtDecode } from 'jwt-decode';



export default function POSPage() {
    const token = useAuthStore((state) => state.token);
    const setToken = useAuthStore((state) => state.setToken);
    const router = useRouter();
    const [tenantId, setTenantId] = React.useState<string>('');
    const [selectedCategory, setSelectedCategory] = React.useState('All');

    React.useEffect(() => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setTenantId(decoded.tenantId);
            } catch (error) {
                console.error('Invalid token', error);
            }
        }
    }, [token]);

    // Sync data in background
    useSync(tenantId);

    // Fetch products from local DB (reactive)
    const products = useLiveQuery(
        () => {
            if (!tenantId) return [];
            return db.products.where({ tenantId }).toArray();
        },
        [tenantId]
    ) || [];

    // Extract unique categories
    const categories = React.useMemo(() => {
        const cats = new Set(products.map((p: any) => p.category || 'Uncategorized'));
        return ['All', ...Array.from(cats)];
    }, [products]);

    // Filter products
    const filteredProducts = React.useMemo(() => {
        if (selectedCategory === 'All') return products;
        return products.filter((p: any) => (p.category || 'Uncategorized') === selectedCategory);
    }, [products, selectedCategory]);

    const handleLogout = () => {
        setToken('');
        router.push('/login');
    };

    return (
        <PosLayout sidebar={<CartSidebar />}>
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Menu</h1>
                    <button
                        onClick={handleLogout}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {categories.map((cat: string) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full border transition-all whitespace-nowrap ${selectedCategory === cat
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-primary/10 hover:border-primary'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                ))}
                {filteredProducts.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <p>No products found in this category.</p>
                    </div>
                )}
            </div>
        </PosLayout>
    );
}
