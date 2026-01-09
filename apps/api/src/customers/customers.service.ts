import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer)
        private customersRepository: Repository<Customer>,
    ) { }

    create(createCustomerDto: any) {
        const customer = this.customersRepository.create(createCustomerDto);
        return this.customersRepository.save(customer);
    }

    findAll(tenantId: string) {
        return this.customersRepository.find({
            where: { tenantId },
            order: { name: 'ASC' },
        });
    }

    findOne(id: string) {
        return this.customersRepository.findOne({ where: { id } });
    }

    findByPhone(tenantId: string, phoneNumber: string) {
        return this.customersRepository.findOne({ where: { tenantId, phoneNumber } });
    }

    async update(id: string, updateCustomerDto: any) {
        await this.customersRepository.update(id, updateCustomerDto);
        return this.findOne(id);
    }

    remove(id: string) {
        return this.customersRepository.delete(id);
    }
}
