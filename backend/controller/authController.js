import User from '../model/userModel.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
dotenv.config();


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

const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) return res.status(401).json({success: false, message: "refreshToken not found"});
        const user = await User.findOne({where: {refreshToken: refreshToken}});
        if(!user.refreshToken) return res.status(401).json({success: false, message: "User not found"});
        const userId = user.id;
        await User.update({refreshToken: null}, {where: {id: userId}});
        res.clearCookie("refreshToken");
        res.status(200).json({success: true, message: "User Logged Out Successfully"});
    } catch (error) {
        res.status(500).json({success: false, message: "Failed to logout user", error});
    }
}
export { register, login, logout };