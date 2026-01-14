import React from 'react';
import { ShoppingBag, DollarSign, TrendingUp, Clock } from 'lucide-react';

export default function TenantDashboardPage() {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard title="Today's Sales" value="$1,240" icon={<DollarSign className="text-green-500" />} />
                <StatsCard title="Total Orders" value="85" icon={<ShoppingBag className="text-blue-500" />} />
                <StatsCard title="Avg. Order Value" value="$14.50" icon={<TrendingUp className="text-purple-500" />} />
                <StatsCard title="Avg. Prep Time" value="12m" icon={<Clock className="text-orange-500" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                                <div>
                                    <h4 className="font-medium text-gray-800">Order #{1000 + i}</h4>
                                    <p className="text-sm text-gray-500">2 items • Dine-in</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">$24.50</p>
                                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Completed</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Popular Items</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg"></div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-800">Classic Burger</h4>
                                    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: `${80 - i * 10}%` }}></div>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-600">{80 - i * 10} sold</span>
                            </div>
                        ))}
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
