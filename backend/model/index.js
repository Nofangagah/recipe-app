// models/index.js

import User from './userModel.js';
import Recipe from './recipeModel.js';
import Bookmark from './bookmarkModel.js';
import Rating from './ratingModel.js';
import Comment from './commentModel.js';
import Ingredient from './ingredientsModel.js';
import Instruction from './instructionModel.js';
import db from '../config/database.js';

//
// 🔄 Relasi User - Recipe
//
User.hasMany(Recipe, { foreignKey: 'userId', as: 'recipes' });
Recipe.belongsTo(User, { foreignKey: 'userId', as: 'user' });

//
// 🔖 Relasi User - Bookmark - Recipe
//
User.hasMany(Bookmark, { foreignKey: 'userId', as: 'bookmarks' });
Bookmark.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Recipe.hasMany(Bookmark, { foreignKey: 'recipeId', as: 'bookmarks' });
Bookmark.belongsTo(Recipe, { foreignKey: 'recipeId', as: 'recipe' });

//
// ⭐ Relasi User - Rating - Recipe
//
User.hasMany(Rating, { foreignKey: 'userId', as: 'ratings' });
Rating.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Recipe.hasMany(Rating, { foreignKey: 'recipeId', as: 'ratings' });
Rating.belongsTo(Recipe, { foreignKey: 'recipeId', as: 'recipe' });

//
// 💬 Relasi User - Comment - Recipe
//
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Recipe.hasMany(Comment, { foreignKey: 'recipeId', as: 'comments' });
Comment.belongsTo(Recipe, { foreignKey: 'recipeId', as: 'recipe' });

//
// 💬🧵 Nested Comment (balasan)
//
Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentId' });
Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId' });



//
// 🥕 Relasi Recipe - Ingredient
//
Recipe.hasMany(Ingredient, { foreignKey: 'recipeId', as: 'ingredients', onDelete: 'CASCADE' });
Ingredient.belongsTo(Recipe, { foreignKey: 'recipeId', as: 'recipe' });

//
// 📋 Relasi Recipe - Instruction
//
Recipe.hasMany(Instruction, { foreignKey: 'recipeId', as: 'instructions', onDelete: 'CASCADE' });
Instruction.belongsTo(Recipe, { foreignKey: 'recipeId', as: 'recipe' });

export {
  db,
  User,
  Recipe,
  Bookmark,
  Rating,
  Comment,
  Ingredient,
  Instruction,
};
