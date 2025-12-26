import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const connectDB = async () => {
    try {
        // Get connection string from environment variable
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            throw new Error("MONGODB_URI is not defined in .env file");
        }

        // Connect to MongoDB
        await mongoose.connect(mongoURI);
        
        console.log("✅ MongoDB connected successfully");
        
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error.message);
        throw error;
    }
};