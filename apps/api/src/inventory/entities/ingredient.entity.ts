import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('ingredients')
export class Ingredient {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    unit: string; // e.g., 'kg', 'g', 'l', 'pcs'

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    currentStock: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    costPerUnit: number;

    @Column()
    tenantId: string;

    @Column({ nullable: true })
    branchId: string;

    @ManyToOne('Branch', { nullable: true })
    @JoinColumn({ name: 'branchId' })
    branch: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
