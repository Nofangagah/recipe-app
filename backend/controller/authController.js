import User from '../model/userModel.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
dotenv.config();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: The user's name
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email
 *         password:
 *           type: string
 *           format: password
 *           description: The hashed password
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *           description: The user's role
 *         refreshToken:
 *           type: string
 *           description: The refresh token for authentication
 *       example:
 *         id: 1
 *         name: John Doe
 *         email: john@example.com
 *         role: user
 * 
 *     RegisterUser:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *       example:
 *         name: John Doe
 *         email: john@example.com
 *         password: password123
 * 
 *     LoginUser:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *       example:
 *         email: john@example.com
 *         password: password123
 * 
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             email:
 *               type: string
 * 
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUser'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request (validation errors)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Internal server error
 */
const register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Cek apakah user sudah ada
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }
        // Validasi email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        // Validasi password
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        const allowedKeys = ['name', 'email', 'password'];
        const keys = Object.keys(req.body);
        const invalidKeys = keys.filter((key) => !allowedKeys.includes(key));

        if (invalidKeys.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid fields: ${invalidKeys.join(', ')}`,
            });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Buat user baru
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUser'
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=abcde12345; HttpOnly; Secure; SameSite=None; Max-Age=604800
 *       400:
 *         description: Bad request (validation errors)
 *       401:
 *         description: Unauthorized (invalid credentials)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
const login = async (req, res) => {
    const { email, password } = req.body;
    const allowedKeys = ['email', 'password'];
    const keys = Object.keys(req.body);
    const invalidKeys = keys.filter((key) => !allowedKeys.includes(key));
    if (invalidKeys.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Invalid fields: ${invalidKeys.join(', ')}`
        });
    }
    if (!email || typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({ success: false, message: "Email is required and must be a string" });
    }
    if (!password || typeof password !== 'string' || password.trim() === '') {
        return res.status(400).json({ success: false, message: "Password is required and must be a string" });
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ success: false, message: "Incorrect Password" });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await User.update({ refreshToken }, { where: { id: user.id } });

        // Ambil user terbaru
        const updatedUser = await User.findByPk(user.id, {
            attributes: ['id', 'name', 'email', 'role', 'refreshToken']
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 hari
        });

        res.status(200).json({
            success: true,
            message: "User Logged In Successfully",
            accessToken,
            refreshToken,
            user: updatedUser
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to login user", error });
    }
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       500:
 *         description: Internal server error
 */
const logout = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Authorization header missing or malformed"
            });
        }

        const refreshToken = authHeader.split(' ')[1];
        const user = await User.findOne({ where: { refreshToken } });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found or already logged out"
            });
        }

        // Hapus refresh token dari DB
        await User.update({ refreshToken: null }, { where: { id: user.id } });

        return res.status(200).json({
            success: true,
            message: "User Logged Out Successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to logout user",
            error: error.message
        });
    }
};

export { register, login, logout };