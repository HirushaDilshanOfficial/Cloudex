import React from 'react';
export const dynamic = 'force-dynamic';

import { TenantLayout } from '@/components/tenant/tenant-layout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <TenantLayout>{children}</TenantLayout>;
}
