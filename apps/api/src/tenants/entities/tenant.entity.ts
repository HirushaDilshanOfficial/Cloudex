import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tenants')
export class Tenant extends BaseEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ default: 'USD' })
    currency: string;

    @Column({ default: 'Tax' })
    taxName: string;

    @Column({ type: 'float', default: 0 })
    taxRate: number;

    @OneToMany(() => User, (user) => user.tenant)
    users: User[];
}
