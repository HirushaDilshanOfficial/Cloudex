import { useEffect } from 'react';
import { syncProducts, syncOfflineOrders } from '@/services/sync-service';

export function useSync(tenantId: string) {
    useEffect(() => {
        // Ensure tenantId is a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!tenantId || !uuidRegex.test(tenantId)) return;

        // Initial sync
        syncProducts(tenantId);
        syncOfflineOrders();

        // Periodic sync (every 5 minutes)
        const intervalId = setInterval(() => {
            syncProducts(tenantId);
            syncOfflineOrders();
        }, 5 * 60 * 1000);

        // Sync when coming back online
        const handleOnline = () => {
            console.log('Online detected, syncing...');
            syncOfflineOrders();
        };

        window.addEventListener('online', handleOnline);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('online', handleOnline);
        };
    }, [tenantId]);
}
