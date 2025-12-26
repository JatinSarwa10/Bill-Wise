import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect("mongodb+srv://sarwajatin_db_user:billwise1234@cluster0.hjxtxpu.mongodb.net/billwise")
    .then(()=>{console.log("DB connected ")})
}