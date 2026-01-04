import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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

    @Column()
    tenantId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
