import Express from 'express';
import { register, login, logout } from '../controller/authController.js';
import getAccessToken from '../controller/tokenController.js';

const router = Express.Router();


router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/token', getAccessToken);

export default router;