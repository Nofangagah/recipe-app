import { Sequelize } from "sequelize";
import db from "../config/database.js";
const { DataTypes } = Sequelize;

const Rating = db.define(
    "rating",
    {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        recipeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        rating: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        }
    },
    {
        freezeTableName: true,
        indexes: [
            {
                fields: ['userId', 'recipeId'],
                unique: true // Ensure a user can only rate a recipe once
            }
        ]
        ,
        timestamps: true, // Menambahkan createdAt dan updatedAt
    }
);
export default Rating;