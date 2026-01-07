import { db, Product } from '@/lib/db';
import api from '@/lib/api';

export const syncProducts = async (tenantId: string) => {
    if (!tenantId) {
        console.warn('Sync skipped: No tenantId provided');
        return [];
    }

    try {
        // 1. Fetch from API
        const response = await api.get<Product[]>('/products', {
            params: { tenantId },
        });
        const products = response.data;

        // 2. Update IndexedDB
        await db.transaction('rw', db.products, async () => {
            await db.products.where({ tenantId }).delete(); // Clear old cache for this tenant
            await db.products.bulkPut(products);
        });

        console.log(`Synced ${products.length} products for tenant ${tenantId}`);
        return products;
    } catch (error) {
        console.error('Failed to sync products:', error);
        // Fallback to offline data is handled by the component querying Dexie
        return [];
    }
};

export const saveOfflineOrder = async (order: any) => {
    await db.offlineOrders.add({
        ...order,
        createdAt: new Date(),
        synced: false,
    });
};

export const syncOfflineOrders = async () => {
    // Use boolean value for equality check on 'synced' index
    const unsyncedOrders = await db.offlineOrders.where('synced').equals(0).toArray(); // Dexie often stores booleans as 0/1 in indices, or use equals(false)

    for (const order of unsyncedOrders) {
        try {
            await api.post('/orders', {
                tenantId: order.tenantId,
                items: order.items,
                totalAmount: order.totalAmount,
            });

            // Mark as synced or delete
            await db.offlineOrders.update(order.id!, { synced: true });
            // Optional: Delete after sync
            // await db.offlineOrders.delete(order.id!);
        } catch (error) {
            console.error('Failed to sync order:', order.id, error);
        }
    }
};
