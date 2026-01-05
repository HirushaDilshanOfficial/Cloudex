'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    role: string;
    sub: string;
    email: string;
    tenantId: string;
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const setToken = useAuthStore((state) => state.setToken);
    const setUser = useAuthStore((state) => state.setUser);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3001/auth/login', {
                email,
                password,
            });
            const { access_token, user } = response.data;
            setToken(access_token);
            const decoded: DecodedToken = jwtDecode(access_token);

            if (decoded.role === 'cashier') {
                router.push('/pos');
            } else if (decoded.role === 'kitchen') {
                router.push('/kds');
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Login to Cloudex</h1>
                {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border rounded-lg mt-1"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded-lg mt-1"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Login
                    </button>
                </form>
                <div className="mt-4 text-center text-sm text-gray-600">
                    Don't have an account? <Link href="/register" className="text-primary hover:underline">Register</Link>
                </div>
            </div>
        </div>
    );
}
