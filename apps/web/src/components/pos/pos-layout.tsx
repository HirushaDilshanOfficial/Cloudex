import React from 'react';

interface PosLayoutProps {
    children: React.ReactNode;
    sidebar: React.ReactNode;
}

export function PosLayout({ children, sidebar }: PosLayoutProps) {
    return (
        <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
            {/* Main Content Area (Product Grid) */}
            <main className="flex-1 overflow-y-auto p-4">
                {children}
            </main>

            {/* Right Sidebar (Cart) */}
            <aside className="w-96 bg-white shadow-xl border-l border-gray-200 flex flex-col">
                {sidebar}
            </aside>
        </div>
    );
}
