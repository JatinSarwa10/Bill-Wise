import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express'
import { connectDB } from './config/db.js';


const app = express();
const port = 4000;

//middleware
app.use(cors());
app.use(clerkMiddleware())
app.use(express.json({limit: "20mb"}));
app.use(express.urlencoded({limit: "20mb", extended: true}))

//db connections
connectDB();

//routes

app.get('/',(req,res)=>{
    res.send("api is working");
})

app.listen(port, ()=>{
    console.log(`server is running on http://localhost:${port}`)
})