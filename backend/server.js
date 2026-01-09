import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express'
import { connectDB } from './config/db.js';
import path from "path";

import invoiceRouter from './routes/inoviceRouter.js';
import businessProfileRouter from './routes/businessProfileRouter.js';
import aiInvoiceRouter from './routes/aiInvoiceRouter.js';


const app = express();
const port = process.env.PORT || 4000;

//middleware
app.use(cors({
    origin:process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}
));
app.use(clerkMiddleware({
    clockSkewTolerance: 30
}))
app.use(express.json({limit: "20mb"}));
app.use(express.urlencoded({limit: "20mb", extended: true}))

//db connections
connectDB();

//routes
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/invoice", invoiceRouter);
app.use("/api/businessProfile",businessProfileRouter);
app.use('/api/ai', aiInvoiceRouter);

app.get('/',(req,res)=>{
    res.send("api is working");
})

app.listen(port, ()=>{
    console.log(`server is running on port ${port}`)
})