import express from 'express'

import{createInvoice, deleteInvoice, getInvoice, getInvoiceByID, updateInvoice} from "../controllers/inoviceControllers.js"
import { clerkMiddleware } from '@clerk/express'

const invoiceRouter = express.Router();

invoiceRouter.use(clerkMiddleware());

invoiceRouter.get("/", getInvoice);

invoiceRouter.get("/:id", getInvoiceByID);

invoiceRouter.post("/", createInvoice);

invoiceRouter.put("/:id",updateInvoice);

invoiceRouter.delete("/:id", deleteInvoice);

export default invoiceRouter;

