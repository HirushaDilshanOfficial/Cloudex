import React from 'react';
import { Package, AlertTriangle, LogOut, RefreshCw, LayoutGrid, List, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

interface KdsHeaderProps {
    totalOrders: number;
    pendingCount: number;
    preparingCount: number;
    completedCount?: number;
    onViewStock: () => void;
    onReportLowStock: () => void;
    onLogout: () => void;
    onRefresh: () => void;
    audioEnabled?: boolean;
    onToggleAudio?: () => void;
    activeTab: 'active' | 'history';
    onTabChange: (tab: 'active' | 'history') => void;
}

export function KdsHeader({
    totalOrders,
    pendingCount,
    preparingCount,
    onViewStock,
    onReportLowStock,
    onLogout,
    onRefresh,
    audioEnabled = true,
    onToggleAudio,
    activeTab,
    onTabChange
}: KdsHeaderProps) {
    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-gray-950/80 border-b border-white/10 shadow-lg">
            <div className="max-w-[1920px] mx-auto px-4 lg:px-6 h-20 flex items-center justify-between">
                {/* Logo & Title */}
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <LayoutGrid className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Kitchen Display</h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-medium text-emerald-400">System Online</span>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-gray-900 border border-gray-800 p-1 rounded-lg">
                    <button
                        onClick={() => onTabChange('active')}
                        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'active' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => onTabChange('history')}
                        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                        History
                    </button>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-4 bg-white/5 rounded-xl p-2 border border-white/5">
                    <StatItem label="Active" value={totalOrders} color="text-white" />
                    <div className="w-px h-8 bg-white/10" />
                    <StatItem label="Pending" value={pendingCount} color="text-blue-400" />
                    <div className="w-px h-8 bg-white/10" />
                    <StatItem label="Preparing" value={preparingCount} color="text-orange-400" />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 mr-4">
                        <ActionButton
                            icon={audioEnabled ? Volume2 : VolumeX}
                            label={audioEnabled ? "Sound On" : "Muted"}
                            onClick={onToggleAudio}
                            variant={audioEnabled ? "secondary" : "warning"}
                        />
                        <div className="w-px h-6 bg-white/10 mx-2" />
                        <ActionButton
                            icon={RefreshCw}
                            label="Refresh"
                            onClick={onRefresh}
                            variant="secondary"
                        />
                        <div className="w-px h-6 bg-white/10 mx-2" />
                        <ActionButton
                            icon={Package}
                            label="Stock"
                            onClick={onViewStock}
                            variant="secondary"
                        />
                        <ActionButton
                            icon={AlertTriangle}
                            label="Report"
                            onClick={onReportLowStock}
                            variant="warning"
                        />
                    </div>

                    <button
                        onClick={onLogout}
                        className="p-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/20"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
}

function StatItem({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className="flex flex-col items-center px-4 min-w-[80px]">
            <span className={`text-xl font-bold leading-none mb-1 ${color}`}>{value}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">{label}</span>
        </div>
    );
}

function ActionButton({ icon: Icon, label, onClick, variant = 'primary' }: any) {
    const baseClasses = "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-500 border-transparent shadow-lg shadow-blue-900/20",
        secondary: "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border-white/5",
        warning: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/20",
    };

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${variants[variant as keyof typeof variants]}`}
        >
            <Icon size={16} />
            <span className="hidden lg:inline">{label}</span>
        </button>
    );
}
