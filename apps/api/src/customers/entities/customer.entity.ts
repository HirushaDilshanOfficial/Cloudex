import { Entity, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Order } from '../../orders/entities/order.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('customers')
export class Customer extends BaseEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    email: string;

    @Column({ default: 0 })
    loyaltyPoints: number;

    @Column()
    tenantId: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @OneToMany(() => Order, (order) => order.customer)
    orders: Order[];
}
