import Express from 'express';
import { createRecipe, getAllRecipes, getRecipeById, updateRecipe, deleteRecipe } from '../controller/recipeController.js';
import verifyToken from '../middleware/verifyToken.js';
import upload from '../middleware/uploadMiddleware.js'
import multerErrorHandler from '../middleware/multerErrorHandler.js';

const router = Express.Router();
router.get('/', getAllRecipes);
router.get('/:id', getRecipeById);
router.post('/', verifyToken, upload.single('image'), multerErrorHandler, createRecipe);
router.patch('/:id', verifyToken, upload.single('image'), multerErrorHandler, updateRecipe);
router.delete('/:id', verifyToken, deleteRecipe);

export default router;
