import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum TableStatus {
    AVAILABLE = 'available',
    OCCUPIED = 'occupied',
    RESERVED = 'reserved',
}

@Entity('tables')
export class Table extends BaseEntity {
    @Column()
    name: string;

    @Column({ type: 'int' })
    capacity: number;

    @Column({
        type: 'enum',
        enum: TableStatus,
        default: TableStatus.AVAILABLE,
    })
    status: TableStatus;

    @Column({ type: 'timestamp', nullable: true })
    lastOrderTime: Date;

    @Column({ default: false })
    isArchived: boolean;

    @Column()
    tenantId: string;

    @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column({ nullable: true })
    branchId: string;

    @ManyToOne('Branch', { nullable: true })
    @JoinColumn({ name: 'branchId' })
    branch: any;
}
