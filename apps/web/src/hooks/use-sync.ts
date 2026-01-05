import { useEffect } from 'react';
import { syncProducts, syncOfflineOrders } from '@/services/sync-service';

export function useSync(tenantId: string) {
    useEffect(() => {
        if (!tenantId) return;

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
