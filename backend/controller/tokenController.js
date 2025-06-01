import Users from "../model/userModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const getAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) return res.status(401).json({success: false, message: "refreshToken not found"});
        
        const user = await Users.findOne({where: {refreshToken: refreshToken}});
        if(!user.refreshToken) return res.status(401).json({success: false, message: "refreshToken not found"});
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({success: false, message: "refreshToken is invalid"});
            }
            const userPlain = user.toJSON();
            const { password: _, refresh_token: __, ...SafeUserData } = userPlain;
            const accessToken = jwt.sign(SafeUserData, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "10m"});
            res.status(200).json({success: true, message: "Access token generated successfully", accessToken});
        })
    } catch (error) {
        res.status(500).json({success: false, message: "Failed to generate access token", error});
        
    }
}

export default getAccessToken;