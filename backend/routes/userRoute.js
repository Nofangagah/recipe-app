import Express from 'express';
import  editProfile  from '../controller/userController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = Express.Router();
router.patch('/editProfile', verifyToken, editProfile);

export default router;