import express from 'express';
import {
  getCommentsByRecipe,
  createComment,
  deleteComment,
} from '../controller/commentController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// ✅ Get all comments for a specific recipe
router.get('/recipe/:recipeId', getCommentsByRecipe);

// ➕ Add a new comment or reply (user must be logged in)
router.post('/recipe/:recipeId', verifyToken, createComment);

// ❌ Delete a comment (by owner or admin)
router.delete('/:id', verifyToken, deleteComment);

export default router;
