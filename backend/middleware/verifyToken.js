import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const verifyToken = (req, res, next) => {
    try {
        const header = req.headers['authorization'];
        let token;
        if(header) token = header.split(' ')[1];
        if(!token) return res.status(401).json({ success: false, message: "Access token not found" });
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if(err) return res.status(403).json({ success: false, message: "Invalid access token" });
            req.user = decoded;
            next();
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: "Failed to authenticate user", error });
    }
}
export default verifyToken