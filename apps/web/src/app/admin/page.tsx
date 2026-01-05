import React from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Users, Store, DollarSign, Activity } from 'lucide-react';

export default function AdminDashboardPage() {
    return (
        <AdminLayout>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard title="Total Tenants" value="12" icon={<Store className="text-blue-500" />} />
                <StatsCard title="Active Users" value="45" icon={<Users className="text-green-500" />} />
                <StatsCard title="Total Revenue" value="$12,450" icon={<DollarSign className="text-yellow-500" />} />
                <StatsCard title="System Health" value="98%" icon={<Activity className="text-purple-500" />} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Tenants</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="pb-3 font-medium text-gray-500">Name</th>
                                <th className="pb-3 font-medium text-gray-500">Plan</th>
                                <th className="pb-3 font-medium text-gray-500">Status</th>
                                <th className="pb-3 font-medium text-gray-500">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="border-b border-gray-50 last:border-0">
                                    <td className="py-3 text-gray-800 font-medium">Restaurant {i}</td>
                                    <td className="py-3 text-gray-600">Pro Plan</td>
                                    <td className="py-3"><span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">Active</span></td>
                                    <td className="py-3 text-gray-500">Jan {i}, 2024</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
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
