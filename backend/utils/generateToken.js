import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const generateAccessToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email, role:user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "10m" });
};

const generateRefreshToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

export { generateAccessToken, generateRefreshToken };