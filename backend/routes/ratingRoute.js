import Express from 'express';
import {rateRecipe, getAverageRating, getUserRatings, deleteUserRating, getTopRatedRecipes } from '../controller/ratingController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = Express.Router();
router.post('/recipe/:recipeId', verifyToken, rateRecipe);


router.get('/recipe/:recipeId', getAverageRating);


router.get('/my', verifyToken, getUserRatings);


router.delete('/recipe/:recipeId', verifyToken, deleteUserRating);

router.get('/top', getTopRatedRecipes);

export default router;