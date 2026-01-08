import React from 'react';
import { useCartStore } from '@/store/cart-store';
import { Plus } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    category?: string;
}

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem);

    return (
        <div
            onClick={() => addItem({ productId: product.id, name: product.name, price: product.price, quantity: 1 })}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between h-48"
        >
            <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{product.category}</p>
            </div>
            <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-xl text-primary">${Number(product.price).toFixed(2)}</span>
                <button className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
                    <Plus size={20} />
                </button>
            </div>
        </div>
    );
}
