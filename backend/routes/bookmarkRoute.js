import Express from 'express';
import { addBookmark, removeBookmark, getMyBookmarks } from '../controller/bookmarkcontroller.js';
import verifyToken from '../middleware/verifyToken.js';
const router = Express.Router();

router.post('/bookmarks', verifyToken, addBookmark);
router.delete('/bookmarks/:recipeId', verifyToken, removeBookmark);
router.get('/bookmarks', verifyToken, getMyBookmarks);

export default router;