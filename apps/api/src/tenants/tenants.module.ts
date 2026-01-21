import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Tenant, User, Order])],
    controllers: [TenantsController],
    providers: [TenantsService],
    exports: [TypeOrmModule, TenantsService],
})
export class TenantsModule { }
