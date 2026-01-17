import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeItem } from './entities/recipe-item.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';

@Injectable()
export class RecipesService {
    constructor(
        @InjectRepository(Recipe)
        private recipesRepository: Repository<Recipe>,
        @InjectRepository(RecipeItem)
        private recipeItemsRepository: Repository<RecipeItem>,
    ) { }

    async create(data: CreateRecipeDto): Promise<Recipe> {
        const { items, ...recipeData } = data;

        const recipe = this.recipesRepository.create(recipeData);
        const savedRecipe = (await this.recipesRepository.save(recipe)) as unknown as Recipe;

        if (items && items.length > 0) {
            const recipeItems = items.map((item) =>
                this.recipeItemsRepository.create({
                    ...item,
                    recipe: savedRecipe,
                })
            );
            await this.recipeItemsRepository.save(recipeItems);
        }

        const foundRecipe = await this.findOne(savedRecipe.id);
        if (!foundRecipe) {
            throw new Error('Failed to create recipe');
        }
        return foundRecipe;
    }

    findAll(tenantId: string): Promise<Recipe[]> {
        return this.recipesRepository.find({
            where: { tenantId },
            relations: ['product', 'items', 'items.ingredient'],
        });
    }

    findOne(id: string): Promise<Recipe | null> {
        return this.recipesRepository.findOne({
            where: { id },
            relations: ['product', 'items', 'items.ingredient'],
        });
    }

    async findByProduct(productId: string): Promise<Recipe | null> {
        return this.recipesRepository.findOne({
            where: { productId },
            relations: ['items', 'items.ingredient'],
        });
    }
}
