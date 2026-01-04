import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    CASHIER = 'cashier',
}

@Entity('users')
export class User extends BaseEntity {
    @Column({ unique: true })
    email: string;

    @Column()
    passwordHash: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CASHIER,
    })
    role: UserRole;

    @Column()
    tenantId: string;

    @ManyToOne(() => Tenant, (tenant) => tenant.users)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;
}
