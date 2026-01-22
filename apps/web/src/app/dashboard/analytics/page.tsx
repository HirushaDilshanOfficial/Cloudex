'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, DollarSign, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { jwtDecode } from 'jwt-decode';

interface AnalyticsStats {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalProfit: number;
}

export default function AnalyticsPage() {
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [salesTrend, setSalesTrend] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const token = useAuthStore((state) => state.token);
    const [tenantId, setTenantId] = useState<string>('');

    const [tenantDetails, setTenantDetails] = useState<{ name: string; logo?: string; address?: string; phone?: string; email?: string } | null>(null);

    useEffect(() => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setTenantId(decoded.tenantId);
            } catch (error) {
                console.error('Invalid token', error);
            }
        }
    }, [token]);

    useEffect(() => {
        if (tenantId && token) {
            const fetchTenantDetails = async () => {
                try {
                    const response = await fetch(`http://localhost:3001/tenants/${tenantId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setTenantDetails(data);
                    }
                } catch (error) {
                    console.error('Failed to fetch tenant details', error);
                }
            };
            fetchTenantDetails();
        }
    }, [tenantId, token]);

    useEffect(() => {
        const fetchData = async () => {
            if (!tenantId) return;

            setLoading(true);
            try {
                const [statsRes, trendRes, topRes] = await Promise.all([
                    api.get(`/analytics/sales/${period}?tenantId=${tenantId}`),
                    api.get(`/analytics/sales/trend?tenantId=${tenantId}&days=${period === 'daily' ? 7 : period === 'weekly' ? 30 : 90}`),
                    api.get(`/analytics/products/top?tenantId=${tenantId}`),
                ]);

                setStats(statsRes.data);
                setSalesTrend(trendRes.data);
                setTopProducts(topRes.data);
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, tenantId, period]);

    const handleDownloadReport = async () => {
        const doc = new jsPDF();
        const date = new Date().toLocaleDateString();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // --- Header ---
        let yPos = 20;

        // Logo
        if (tenantDetails?.logo) {
            try {
                const img = new Image();
                img.src = tenantDetails.logo;
                await new Promise((resolve) => {
                    img.onload = resolve;
                });
                doc.addImage(img, 'PNG', 14, 15, 25, 25);
            } catch (e) {
                console.error("Failed to load logo for PDF", e);
            }
        }

        // Company Info
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(tenantDetails?.name || 'My Restaurant', 45, 22);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);

        let contactY = 28;
        if (tenantDetails?.address) {
            doc.text(tenantDetails.address, 45, contactY);
            contactY += 5;
        }
        if (tenantDetails?.phone) {
            doc.text(`Phone: ${tenantDetails.phone}`, 45, contactY);
            contactY += 5;
        }
        if (tenantDetails?.email) {
            doc.text(`Email: ${tenantDetails.email}`, 45, contactY);
        }

        // Report Title & Date
        doc.setDrawColor(200);
        doc.line(14, 45, pageWidth - 14, 45); // Separator line

        doc.setTextColor(0);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Analytics Report', 14, 55);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${date}`, 14, 62);
        doc.text(`Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`, 14, 67);

        // --- Content ---

        // Summary Stats
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary Statistics', 14, 80);

        const statsData = [
            ['Total Revenue', `$${stats?.totalRevenue.toFixed(2)}`],
            ['Total Profit', `$${stats?.totalProfit?.toFixed(2) || '0.00'}`],
            ['Total Orders', stats?.totalOrders.toString() || '0'],
            ['Avg. Order Value', `$${stats?.avgOrderValue.toFixed(2)}`],
        ];

        autoTable(doc, {
            startY: 85,
            head: [['Metric', 'Value']],
            body: statsData,
            theme: 'striped',
            headStyles: { fillColor: [66, 139, 202] },
            styles: { fontSize: 10 },
        });

        // Top Products
        const finalY = (doc as any).lastAutoTable.finalY || 85;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Top Selling Products', 14, finalY + 15);

        const productsData = topProducts.map((p, index) => [
            (index + 1).toString(),
            p.name,
            p.sold.toString()
        ]);

        autoTable(doc, {
            startY: finalY + 20,
            head: [['Rank', 'Product Name', 'Units Sold']],
            body: productsData,
            theme: 'striped',
            headStyles: { fillColor: [66, 139, 202] },
            styles: { fontSize: 10 },
        });

        // --- Footer ---
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Generated by Cloudex POS', pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
        }

        doc.save(`analytics_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
                    <p className="text-gray-500">Overview of your business performance</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleDownloadReport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Download size={18} />
                        <span>Download Report</span>
                    </button>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${period === p
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                ${stats?.totalRevenue.toFixed(2)}
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
                            <p className="text-sm font-medium text-gray-500">Total Profit</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                ${stats?.totalProfit?.toFixed(2) || '0.00'}
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                            <Wallet size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Orders</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                {stats?.totalOrders}
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
                                ${stats?.avgOrderValue.toFixed(2)}
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
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Trend</h3>
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
    );
}
