import Dexie, { Table } from 'dexie';

export interface Product {
    id: string;
    name: string;
    price: number;
    category?: string;
    imageUrl?: string;
    tenantId: string;
}

export interface OfflineOrder {
    id?: number; // Auto-incremented for local storage
    tenantId: string;
    items: any[];
    totalAmount: number;
    createdAt: Date;
    synced: boolean;
}

export class CloudexDatabase extends Dexie {
    products!: Table<Product>;
    offlineOrders!: Table<OfflineOrder>;

    constructor() {
        super('CloudexDB');
        this.version(1).stores({
            products: 'id, tenantId, category', // Primary key and indexed props
            offlineOrders: '++id, tenantId, synced',
        });
    }
}

export const db = new CloudexDatabase();
