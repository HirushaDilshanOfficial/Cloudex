import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
    constructor(
        @InjectRepository(Tenant)
        private tenantsRepository: Repository<Tenant>,
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
}
