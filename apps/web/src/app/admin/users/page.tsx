'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Search, Building, User, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface SearchResult {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenant: {
        id: string;
        name: string;
        status: string;
    };
    branch?: {
        name: string;
    };
}

export default function UserSearchPage() {
    const token = useAuthStore((state) => state.token);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setHasSearched(true);
        try {
            const res = await fetch(`http://localhost:3001/users/search?email=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            setResults(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to search users');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Global User Search</h1>

            <form onSubmit={handleSearch} className="mb-8">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by email (e.g. john@example.com)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="absolute right-2 top-2 bottom-2 px-4 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            <div className="space-y-4">
                {results.map((user) => (
                    <div key={user.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="p-3 bg-blue-50 rounded-full h-fit">
                                    <User size={24} className="text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">
                                        {user.firstName} {user.lastName}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-2">{user.email}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600 uppercase tracking-wide">
                                            {user.role}
                                        </span>
                                        {user.branch && (
                                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                                <Building size={14} />
                                                {user.branch.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <Link
                                    href={`/admin/tenants/${user.tenant.id}`}
                                    className="block group"
                                >
                                    <p className="text-xs text-gray-400 mb-1">belongs to</p>
                                    <div className="flex items-center justify-end gap-2 text-indigo-600 font-medium group-hover:underline">
                                        <Building size={16} />
                                        {user.tenant.name}
                                    </div>
                                    <div className="mt-1">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${user.tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {user.tenant.status || 'ACTIVE'}
                                        </span>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}

                {hasSearched && results.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Info className="mx-auto mb-3 text-gray-400" size={32} />
                        <p>No users found matching "{query}"</p>
                    </div>
                )}
            </div>
        </div>
    );
}
