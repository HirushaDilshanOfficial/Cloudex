import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { RecipeItem } from './recipe-item.entity';

@Entity('recipes')
export class Recipe {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Product)
    @JoinColumn()
    product: Product;

    @Column()
    productId: string;

    @OneToMany(() => RecipeItem, (item: RecipeItem) => item.recipe, { cascade: true })
    items: RecipeItem[];

    @ManyToOne('Tenant', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenantId' })
    tenant: any;

    @Column({ nullable: true })
    tenantId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
