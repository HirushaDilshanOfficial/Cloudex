import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Ingredient } from './ingredient.entity';

export enum StockMovementType {
    IN = 'IN',
    OUT = 'OUT',
    ADJUSTMENT = 'ADJUSTMENT',
}

@Entity('stock_movements')
export class StockMovement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Ingredient)
    ingredient: Ingredient;

    @Column()
    ingredientId: string;

    @Column({
        type: 'enum',
        enum: StockMovementType,
    })
    type: StockMovementType;

    @Column('decimal', { precision: 10, scale: 2 })
    quantity: number;

    @Column({ nullable: true })
    reason: string;

    @Column()
    tenantId: string;

    @CreateDateColumn()
    createdAt: Date;
}
