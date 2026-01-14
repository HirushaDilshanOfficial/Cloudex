'use client';

import React, { useEffect, useState } from 'react';

import { useAuthStore } from '@/store/auth-store';
import axios from 'axios';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
    const [dailySales, setDailySales] = useState<any>(null);
    const [salesTrend, setSalesTrend] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const token = useAuthStore((state) => state.token);
    const tenantId = 'b4cce6c2-457a-48c9-ac8b-a4e204a37fa2'; // TODO: Get from context

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [dailyRes, trendRes, topRes] = await Promise.all([
                    axios.get(`http://localhost:3001/analytics/sales/daily?tenantId=${tenantId}`, { headers }),
                    axios.get(`http://localhost:3001/analytics/sales/trend?tenantId=${tenantId}&days=7`, { headers }),
                    axios.get(`http://localhost:3001/analytics/products/top?tenantId=${tenantId}`, { headers }),
                ]);

                setDailySales(dailyRes.data);
                setSalesTrend(trendRes.data);
                setTopProducts(topRes.data);
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchData();
        }
    }, [token]);

    if (loading) {
        return (
            <>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
                    <p className="text-gray-500">Overview of your business performance</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Revenue (Today)</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                    ${dailySales?.totalRevenue.toFixed(2)}
                                </h3>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg text-green-600">
                                <DollarSign size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Orders (Today)</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                    {dailySales?.totalOrders}
                                </h3>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                                <ShoppingBag size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                    ${dailySales?.avgOrderValue.toFixed(2)}
                                </h3>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Trend (Last 7 Days)</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={salesTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" />
                                    <YAxis tickFormatter={(value) => `$${value}`} />
                                    <Tooltip formatter={(value: number | undefined) => [`$${value || 0}`, 'Revenue']} />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#2563eb' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Top Selling Products</h3>
                        <div className="space-y-4">
                            {topProducts.map((product, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full font-bold text-gray-500 border border-gray-200">
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-gray-900">{product.name}</span>
                                    </div>
                                    <div className="text-sm font-medium text-gray-600">
                                        {product.sold} sold
                                    </div>
                                </div>
                            ))}
                            {topProducts.length === 0 && (
                                <p className="text-center text-gray-500 py-8">No sales data available yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
