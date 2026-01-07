import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('branches')
export class Branch extends BaseEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ default: false })
    isMain: boolean;

    @Column()
    tenantId: string;

    @ManyToOne(() => Tenant, (tenant) => tenant.branches)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;
}
