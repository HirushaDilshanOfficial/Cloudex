'use client';

import React from 'react';
import { ShoppingBag, DollarSign, TrendingUp, Clock, Wallet } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { jwtDecode } from 'jwt-decode';

export default function TenantDashboardPage() {
    const [stats, setStats] = React.useState({
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        totalProfit: 0
    });
    const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
    const [popularItems, setPopularItems] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const token = useAuthStore((state) => state.token);
    const [tenantId, setTenantId] = React.useState<string>('');

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

    React.useEffect(() => {
        if (tenantId) {
            fetchDashboardData();
        }
    }, [tenantId]);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, ordersRes, itemsRes] = await Promise.all([
                api.get(`/analytics/sales/daily?tenantId=${tenantId}`),
                api.get(`/analytics/orders/recent?tenantId=${tenantId}`),
                api.get(`/analytics/products/top?tenantId=${tenantId}`)
            ]);

            setStats(statsRes.data);
            setRecentOrders(ordersRes.data);
            setPopularItems(itemsRes.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard title="Today's Sales" value={`LKR ${Number(stats.totalRevenue).toFixed(2)}`} icon={<DollarSign className="text-green-500" />} />
                <StatsCard title="Total Orders" value={stats.totalOrders.toString()} icon={<ShoppingBag className="text-blue-500" />} />
                <StatsCard title="Avg. Order Value" value={`LKR ${Number(stats.avgOrderValue).toFixed(2)}`} icon={<TrendingUp className="text-purple-500" />} />
                <StatsCard title="Total Profit" value={`LKR ${Number(stats.totalProfit).toFixed(2)}`} icon={<Wallet className="text-orange-500" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
                    <div className="space-y-4">
                        {recentOrders.map((order) => (
                            <div key={order.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                                <div>
                                    <h4 className="font-medium text-gray-800">Order #{order.orderNumber || order.id.slice(0, 8)}</h4>
                                    <p className="text-sm text-gray-500">{order.items?.length || 0} items • {order.orderType}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">LKR {Number(order.totalAmount).toFixed(2)}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'completed' ? 'text-green-600 bg-green-100' :
                                        order.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                                            'text-gray-600 bg-gray-100'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {recentOrders.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No recent orders</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Popular Items</h3>
                    <div className="space-y-4">
                        {popularItems.map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-bold">
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                                    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                        <div
                                            className="bg-primary h-2 rounded-full"
                                            style={{ width: `${Math.min((item.sold / (popularItems[0]?.sold || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-600">{item.sold} sold</span>
                            </div>
                        ))}
                        {popularItems.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No data available</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function StatsCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
                {icon}
            </div>
        </div>
    );
}
