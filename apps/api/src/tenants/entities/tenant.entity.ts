import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Branch } from '../../branches/entities/branch.entity';

export enum TenantStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED'
}

@Entity('tenants')
export class Tenant extends BaseEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    domain: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    logo: string;

    @Column({ default: 'USD' })
    currency: string;

    @Column({ default: 'Tax' })
    taxName: string;

    @Column({ type: 'float', default: 0 })
    taxRate: number;

    @OneToMany(() => User, (user) => user.tenant)
    users: User[];

    @OneToMany(() => Branch, (branch) => branch.tenant)
    branches: Branch[];

    @Column({
        type: 'enum',
        enum: TenantStatus,
        default: TenantStatus.ACTIVE
    })
    status: TenantStatus;
}
