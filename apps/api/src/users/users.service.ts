import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findOneByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email }, relations: ['branch'] });
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        try {
            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash(createUserDto.password, salt);

            const user = this.usersRepository.create({
                ...createUserDto,
                passwordHash,
            });
            return await this.usersRepository.save(user);
        } catch (error) {
            if (error.code === '23505') { // Postgres unique constraint violation code
                throw new ConflictException('Email already exists');
            }
            throw error;
        }
    }

    findAll(tenantId: string, branchId?: string): Promise<User[]> {
        const where: any = { tenantId };
        if (branchId) {
            where.branchId = branchId;
        }
        return this.usersRepository.find({ where, relations: ['branch'] });
    }

    findOne(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id }, relations: ['branch'] });
    }

    async remove(id: string): Promise<void> {
        await this.usersRepository.delete(id);
    }

    async update(id: string, updateUserDto: any): Promise<User> {
        try {
            if (updateUserDto.password) {
                const salt = await bcrypt.genSalt();
                updateUserDto.passwordHash = await bcrypt.hash(updateUserDto.password, salt);
                delete updateUserDto.password;
            }
            await this.usersRepository.update(id, updateUserDto);
            return this.usersRepository.findOne({ where: { id } }) as Promise<User>;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }
}
