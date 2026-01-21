import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class TenantsService {
    constructor(
        @InjectRepository(Tenant)
        private tenantsRepository: Repository<Tenant>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
    ) { }

    create(createTenantDto: CreateTenantDto): Promise<Tenant> {
        const tenant = this.tenantsRepository.create(createTenantDto);
        return this.tenantsRepository.save(tenant);
    }

    findAll(): Promise<Tenant[]> {
        return this.tenantsRepository.find();
    }

    findOne(id: string): Promise<Tenant | null> {
        return this.tenantsRepository.findOne({ where: { id } });
    }

    async update(id: string, updateTenantDto: any): Promise<Tenant> {
        await this.tenantsRepository.update(id, updateTenantDto);
        return this.tenantsRepository.findOne({ where: { id } }) as Promise<Tenant>;
    }

    async getDashboardStats() {
        const totalTenants = await this.tenantsRepository.count();
        const activeUsers = await this.usersRepository.count();

        const revenueResult = await this.ordersRepository
            .createQueryBuilder('order')
            .select('SUM(order.totalAmount)', 'total')
            .getRawOne();
        const totalRevenue = revenueResult?.total || 0;

        const recentTenants = await this.tenantsRepository.find({
            order: { createdAt: 'DESC' },
            take: 5
        });

        const systemHealth = 100;

        return {
            totalTenants,
            activeUsers,
            totalRevenue,
            systemHealth,
            recentTenants
        };
    }
    async remove(id: string): Promise<void> {
        await this.tenantsRepository.delete(id);
    }
}
