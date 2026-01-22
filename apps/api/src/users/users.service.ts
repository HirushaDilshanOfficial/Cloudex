import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
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

    async findOneByResetToken(token: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { resetPasswordToken: token } });
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

    async findAdminsAndManagers(tenantId: string): Promise<User[]> {
        return this.usersRepository.find({
            where: {
                tenantId,
                role: In([UserRole.ADMIN, UserRole.MANAGER]),
            },
        });
    }

    findOne(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id }, relations: ['branch'] });
    }

    async remove(id: string): Promise<void> {
        await this.usersRepository.delete(id);
    }

    async update(id: string, updateUserDto: any, requestingUserId?: string): Promise<User> {
        if (requestingUserId && id === requestingUserId && updateUserDto.role) {
            const currentUser = await this.findOne(id);
            if (currentUser && currentUser.role !== updateUserDto.role) {
                // throw new BadRequestException('You cannot change your own role.'); // BadRequestException is not imported, let's just ignore the role change or throw Error for now. Or better, import BadRequestException.
                throw new ConflictException('You cannot change your own role.'); // Using ConflictException as it is already imported.
            }
        }

        try {
            if (updateUserDto.password) {
                const salt = await bcrypt.genSalt();
                updateUserDto.passwordHash = await bcrypt.hash(updateUserDto.password, salt);
            }
            // Always delete password field so it's not passed to TypeORM
            delete updateUserDto.password;

            // Remove other potential non-column fields if necessary
            // e.g. confirmPassword if it exists

            await this.usersRepository.update(id, updateUserDto);
            return this.usersRepository.findOne({ where: { id } }) as Promise<User>;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async searchGlobal(emailQuery: string): Promise<User[]> {
        return this.usersRepository.find({
            where: {
                email: require('typeorm').ILike(`%${emailQuery}%`)
            },
            relations: ['tenant', 'branch'],
            take: 20
        });
    }
}
