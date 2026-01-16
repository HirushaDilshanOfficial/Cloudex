import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { Table } from '../../tables/entities/table.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
    PENDING = 'pending',
    PREPARING = 'preparing',
    READY = 'ready',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum OrderType {
    DINING = 'dining',
    TAKEAWAY = 'takeaway',
}

export enum PaymentMethod {
    CASH = 'CASH',
    CARD = 'CARD',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

@Entity('orders')
export class Order extends BaseEntity {
    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Column({
        type: 'enum',
        enum: ['dining', 'takeaway'],
        default: 'dining',
    })
    orderType: 'dining' | 'takeaway';

    @Column({
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.CASH,
    })
    paymentMethod: PaymentMethod;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    paymentStatus: PaymentStatus;

    @Column({ nullable: true })
    cancellationReason: string;

    @Column({ nullable: true })
    orderNumber: string;

    @Column('decimal', { precision: 10, scale: 2 })
    totalAmount: number;

    @Column()
    tenantId: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column({ nullable: true })
    branchId: string;

    @ManyToOne('Branch', { nullable: true })
    @JoinColumn({ name: 'branchId' })
    branch: any;

    @Column({ nullable: true })
    cashierId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'cashierId' })
    cashier: User;

    @Column({ nullable: true })
    tableId: string;

    @ManyToOne(() => Table, { nullable: true })
    @JoinColumn({ name: 'tableId' })
    table: Table;

    @Column({ nullable: true })
    customerId: string;

    @ManyToOne('Customer', (customer: any) => customer.orders, { nullable: true })
    @JoinColumn({ name: 'customerId' })
    customer: any;

    @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
    items: OrderItem[];
}
