import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeItem } from './entities/recipe-item.entity';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Recipe, RecipeItem])],
    controllers: [RecipesController],
    providers: [RecipesService],
    exports: [RecipesService],
})
export class RecipesModule { }
