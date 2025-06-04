import  Express  from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoute from "./routes/authRoute.js";
import recipeRoute from "./routes/recipeRoute.js";
import commentRoute from "./routes/commentRoute.js";
import ratingRoute from "./routes/ratingRoute.js";
import bookmarkRoute from "./routes/bookmarkRoute.js";
import userRoute from "./routes/userRoute.js";
import cookieParser from "cookie-parser";
import { db } from './model/index.js'


dotenv.config();

const app = Express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
app.use(cookieParser());

db.sync().then( async() => {
   console.log("Database connected successfully");
}).catch((error) => {
    console.log("error creating table", error)
});

app.use("/api/auth", authRoute);
app.use("/api/recipes", recipeRoute);
app.use("/api/comments", commentRoute);
app.use("/api/ratings", ratingRoute);
app.use("/api/bookmarks", bookmarkRoute);
app.use("/api/users", userRoute);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

