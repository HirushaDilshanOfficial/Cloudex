import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BranchesService {
    constructor(
        @InjectRepository(Branch)
        private readonly branchesRepository: Repository<Branch>,
    ) { }

    async create(createBranchDto: CreateBranchDto, user: User): Promise<Branch> {
        const branch = this.branchesRepository.create({
            ...createBranchDto,
            tenantId: user.tenantId,
        });
        return this.branchesRepository.save(branch);
    }

    async findAll(user: User): Promise<Branch[]> {
        return this.branchesRepository.find({
            where: { tenantId: user.tenantId },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string, user: User): Promise<Branch> {
        const branch = await this.branchesRepository.findOne({
            where: { id, tenantId: user.tenantId },
        });
        if (!branch) {
            throw new NotFoundException(`Branch with ID ${id} not found`);
        }
        return branch;
    }

    async update(id: string, updateBranchDto: UpdateBranchDto, user: User): Promise<Branch> {
        const branch = await this.findOne(id, user);
        Object.assign(branch, updateBranchDto);
        return this.branchesRepository.save(branch);
    }

    async remove(id: string, user: User): Promise<void> {
        const branch = await this.findOne(id, user);
        await this.branchesRepository.remove(branch);
    }
}
