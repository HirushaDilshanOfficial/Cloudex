'use client';

import React from 'react';
import { LayoutDashboard, ShoppingBag, Utensils, Users, Settings, LogOut, Armchair, Box } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/store/auth-store';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { AlertTriangle, Bell } from 'lucide-react';

interface DecodedToken {
    role: string;
    branchName?: string;
}

export function TenantLayout({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((state) => state.token);
    const setToken = useAuthStore((state) => state.setToken);
    const router = useRouter();
    let role = '';
    let branchName = '';

    if (token) {
        try {
            const decoded: DecodedToken = jwtDecode(token);
            role = decoded.role;
            branchName = decoded.branchName || '';
        } catch (e) {
            console.error('Invalid token');
        }
    }

    const handleLogout = () => {
        setToken('');
        router.push('/login');
    };



    const [notifications, setNotifications] = React.useState<any[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [showNotifications, setShowNotifications] = React.useState(false);

    // Fetch initial alerts
    React.useEffect(() => {
        if (token && (role === 'admin' || role === 'manager')) {
            const fetchAlerts = async () => {
                try {
                    const decoded: DecodedToken = jwtDecode(token);
                    // @ts-ignore
                    const tenantId = decoded.tenantId;
                    const response = await fetch(`http://localhost:3001/inventory/alerts?tenantId=${tenantId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setNotifications(data);
                        setUnreadCount(data.length);
                    }
                } catch (error) {
                    console.error('Failed to fetch alerts', error);
                }
            };
            fetchAlerts();
        }
    }, [token, role]);

    React.useEffect(() => {
        if (token && (role === 'admin' || role === 'manager')) {
            try {
                const decoded: DecodedToken = jwtDecode(token);
                // @ts-ignore
                const tenantId = decoded.tenantId;
                // @ts-ignore
                const branchId = decoded.branchId;

                const socket = io('http://localhost:3001/inventory');

                socket.on('connect', () => {
                    console.log('Connected to Inventory Gateway');
                    const room = branchId ? `${tenantId}_${branchId}` : tenantId;
                    socket.emit('joinRoom', room);
                });

                socket.on('stockAlert', (alert: any) => {
                    setNotifications(prev => [alert, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    toast((t) => (
                        <div className="flex items-start gap-3">
                            <div className="bg-yellow-100 text-yellow-600 p-2 rounded-full">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">Low Stock Alert</h4>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">{alert.ingredient.name}</span> is running low at <span className="font-medium">{alert.branch.name}</span>.
                                </p>
                                {alert.notes && <p className="text-xs text-gray-500 mt-1 italic">"{alert.notes}"</p>}
                                <div className="mt-2 flex gap-2">
                                    <button
                                        onClick={() => {
                                            router.push('/dashboard/inventory');
                                            toast.dismiss(t.id);
                                        }}
                                        className="text-xs bg-primary text-white px-3 py-1.5 rounded font-medium hover:bg-primary/90"
                                    >
                                        View Inventory
                                    </button>
                                    <button
                                        onClick={() => toast.dismiss(t.id)}
                                        className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded font-medium hover:bg-gray-200"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    ), {
                        duration: 8000,
                        position: 'top-right',
                    });
                });

                return () => {
                    socket.disconnect();
                };
            } catch (error) {
                console.error('Socket connection error', error);
            }
        }
    }, [token, role, router]);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-primary">My Restaurant</h1>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 text-primary font-medium">
                        <LayoutDashboard size={20} />
                        <span>Overview</span>
                    </Link>
                    <Link href="/pos" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                        <ShoppingBag size={20} />
                        <span>POS System</span>
                    </Link>
                    <Link href="/dashboard/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                        <Utensils size={20} />
                        <span>Orders</span>
                    </Link>
                    {(role === 'admin' || role === 'manager') && (
                        <>
                            <Link href="/dashboard/menu" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                                <Utensils size={20} />
                                <span>Menu</span>
                            </Link>
                            <Link href="/dashboard/inventory" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                                <Box size={20} />
                                <span>Inventory</span>
                            </Link>
                            <Link href="/dashboard/customers" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                                <Users size={20} />
                                <span className="font-medium">Customers</span>
                            </Link>
                        </>
                    )}
                    {role === 'admin' && (
                        <>
                            <Link href="/dashboard/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                                <Users size={20} />
                                <span>Staff</span>
                            </Link>
                            <Link href="/dashboard/tables" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                                <Armchair size={20} />
                                <span>Tables</span>
                            </Link>
                            <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                                <Settings size={20} />
                                <span>Settings</span>
                            </Link>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white shadow-sm border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
                    <div className="relative">
                        <button
                            onClick={() => {
                                if (!showNotifications) {
                                    setUnreadCount(0);
                                }
                                setShowNotifications(!showNotifications);
                            }}
                            className="p-2 rounded-full hover:bg-gray-100 relative transition-colors"
                        >
                            <Bell size={20} className="text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-xs text-primary font-medium cursor-pointer" onClick={() => router.push('/dashboard/inventory')}>
                                            View All
                                        </span>
                                    )}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">
                                            No new notifications
                                        </div>
                                    ) : (
                                        notifications.map((alert: any) => (
                                            <div key={alert.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/inventory')}>
                                                <div className="flex items-start gap-3">
                                                    <div className="bg-yellow-100 text-yellow-600 p-1.5 rounded-full mt-0.5">
                                                        <AlertTriangle size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-800 font-medium">
                                                            Low Stock: {alert.ingredient?.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {alert.branch?.name} • {new Date(alert.createdAt).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <span className="block text-sm font-medium text-gray-900 capitalize">{role || 'User'}</span>
                            {branchName && (
                                <span className="block text-xs text-gray-500">{branchName}</span>
                            )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                            {(role?.[0] || 'U').toUpperCase()}
                        </div>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
