'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';
import { Mail, Lock, ArrowRight, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const setToken = useAuthStore((state) => state.setToken);
    const setUser = useAuthStore((state) => state.setUser);

    React.useEffect(() => {
        if (token) {
            try {
                const decoded: DecodedToken = jwtDecode(token);
                if (decoded.role === 'super_admin') {
                    router.push('/admin');
                } else if (decoded.role === 'cashier') {
                    router.push('/pos');
                } else if (decoded.role === 'kitchen') {
                    router.push('/kds');
                } else {
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error('Invalid token:', error);
            }
        }
    }, [token, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:3001/auth/login', {
                email,
                password,
            });
            const { access_token, user } = response.data;
            setToken(access_token);
            setUser(user);
            const decoded: DecodedToken = jwtDecode(access_token);

            if (decoded.role === 'super_admin') {
                router.push('/admin');
            } else if (decoded.role === 'cashier') {
                router.push('/pos');
            } else if (decoded.role === 'kitchen') {
                router.push('/kds');
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('Invalid email or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Image & Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
                <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                            <Utensils className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Cloudex</span>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold mb-6 leading-tight">
                            Manage your restaurant <br /> with confidence.
                        </h2>
                        <p className="text-gray-300 text-lg max-w-md leading-relaxed">
                            The all-in-one platform for modern restaurants. Streamline operations, boost sales, and delight your customers.
                        </p>
                    </div>
                    <div className="text-sm text-gray-400">
                        © 2026 Cloudex Inc. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
                        <p className="mt-2 text-gray-600">Please enter your details to sign in.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Password</label>
                                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            isLoading={isLoading}
                            className="w-full"
                            size="lg"
                        >
                            Sign in <ArrowRight size={18} className="ml-2" />
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">New to Cloudex?</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all"
                        >
                            Create an account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
