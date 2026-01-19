import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Recipe } from './recipe.entity';
import { Ingredient } from '../../inventory/entities/ingredient.entity';

@Entity('recipe_items')
export class RecipeItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Recipe, (recipe) => recipe.items, { onDelete: 'CASCADE' })
    recipe: Recipe;

    @ManyToOne(() => Ingredient, { onDelete: 'CASCADE' })
    ingredient: Ingredient;

    @Column()
    ingredientId: string;

    @Column('decimal', { precision: 10, scale: 2 })
    quantity: number; // Amount of ingredient used per unit of product

    @Column()
    unit: string; // Unit of measurement for this recipe item
}
