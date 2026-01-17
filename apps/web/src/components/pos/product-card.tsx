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
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between h-64"
        >
            <div className="flex-1 flex flex-col gap-2">
                <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden relative">
                    {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-xs">No Image</span>
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-gray-800 line-clamp-2 leading-tight">{product.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                </div>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                <span className="font-bold text-lg text-primary">LKR {Number(product.price).toFixed(2)}</span>
                <button className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
                    <Plus size={20} />
                </button>
            </div>
        </div>
    );
}
