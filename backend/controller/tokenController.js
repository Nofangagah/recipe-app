import Users from "../model/userModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const getAccessToken = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Authorization header missing or malformed"
            });
        }

        const refreshToken = authHeader.split(' ')[1];

        const user = await Users.findOne({ where: { refreshToken } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Refresh token not found in database"
            });
        }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: "Invalid refresh token"
                });
            }

            const userPlain = user.toJSON();
            const { password, refreshToken, ...safeUserData } = userPlain;

            const accessToken = jwt.sign(safeUserData, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "10m"
            });

            return res.status(200).json({
                success: true,
                message: "Access token generated successfully",
                accessToken
            });
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to generate access token",
            error: error.message
        });
    }
};

export default getAccessToken;
