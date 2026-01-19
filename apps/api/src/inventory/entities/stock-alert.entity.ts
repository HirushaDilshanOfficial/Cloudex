import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { Branch } from '../../branches/entities/branch.entity';

export enum StockAlertStatus {
    PENDING = 'pending',
    RESOLVED = 'resolved',
}

@Entity()
export class StockAlert {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    ingredientId: string;

    @ManyToOne(() => Ingredient, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ingredientId' })
    ingredient: Ingredient;

    @Column({ nullable: true })
    branchId: string;

    @ManyToOne(() => Branch)
    @JoinColumn({ name: 'branchId' })
    branch: Branch;

    @Column()
    tenantId: string;

    @Column({
        type: 'enum',
        enum: StockAlertStatus,
        default: StockAlertStatus.PENDING,
    })
    status: StockAlertStatus;

    @Column({ nullable: true })
    notes: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    threshold: number;

    @CreateDateColumn()
    createdAt: Date;
}
