import mongoose from "mongoose";
import Invoice from "../models/invoiceModel.js";
import { getAuth } from "@clerk/express";
import path from 'path'

const API_BASE = "http://localhost:4000";

function computeTotals(items = [], taxPercent = 0) {
  const safe = Array.isArray(items) ? items.filter(Boolean) : [];
  const subtotal = safe.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  const tax = (subtotal * Number(taxPercent || 0)) / 100;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function parseItemsField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (error) {
      console.log(error);
      return [];
    }
  }
  return val;
}

function isObjectIdString(val) {
  return mongoose.Types.ObjectId.isValid(val);
}

function uploadedFilesToUrls(req) {
  const urls = {};
  if (!req.files) return urls;
  const mapping = {
    logoName: "logoDataUrl",
    stampName: "stampDataUrl",
    signatureNameMeta: "signatureDataUrl",
    logo: "logoDataUrl",
    stamp: "stampDataUrl",
    signature: "signatureDataUrl",
  };
  Object.keys(mapping).forEach((field) => {
    const arr = req.files[field];
    if (Array.isArray(arr) && arr[0]) {
      const filename =
        arr[0].filename || (arr[0].path && path.basename(arr[0].path));
      if (filename) urls[mapping[field]] = `${API_BASE}/uploads/${filename}`;
    }
  });
  return urls;
}

async function generateUniqueInvoiceNumber(attempts = 8) {
  for (let i = 0; i < attempts; i++) {
    const ts = Date.now().toString();
    const suffix = Math.floor(Math.random() * 900000)
      .toString()
      .padStart(6, "0");
    const candidate = `INV-${ts.slice(-6)}-${suffix}`;

    const exists = await Invoice.exists({ invoiceNumber: candidate });
    if (!exists) return candidate;
    await new Promise((r) => setTimeout(r, 2));
  }
  return new mongoose.Types.ObjectId().toString();
}

/* ----------------- CREATE ----------------- */
export async function createInvoice(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const body = req.body || {};
    const items = Array.isArray(body.items)
      ? body.items
      : parseItemsField(body.items);
    const taxPercent = Number(
      body.taxPercent ?? body.tax ?? body.defaultTaxPercent ?? 0
    );
    const totals = computeTotals(items, taxPercent);
    const fileUrls = uploadedFilesToUrls(req);

    let invoiceNumberProvided =
      typeof body.invoiceNumber === "string" && body.invoiceNumber.trim()
        ? String(body.invoiceNumber).trim()
        : null;

    if (invoiceNumberProvided) {
      const duplicate = await Invoice.exists({
        invoiceNumber: invoiceNumberProvided,
      });
      if (duplicate) {
        return res
          .status(409)
          .json({ success: false, message: "Invoice number already exists" });
      }
    }

    let invoiceNumber =
      invoiceNumberProvided || (await generateUniqueInvoiceNumber());

    const doc = new Invoice({
      _id: new mongoose.Types.ObjectId(),
      owner: userId,
      invoiceNumber,
      issueDate: body.issueDate || new Date().toISOString().slice(0, 10),
      dueDate: body.dueDate || "",
      fromBusinessName: body.fromBusinessName || "",
      fromEmail: body.fromEmail || "",
      fromAddress: body.fromAddress || "",
      fromPhone: body.fromPhone || "",
      fromGst: body.fromGst || "",
      client:
        typeof body.client === "string" && body.client.trim()
          ? { name: body.client }
          : body.client || {},
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: body.currency || "INR",
      status: body.status ? String(body.status).toLowerCase() : "draft",
      taxPercent,
      logoDataUrl:
        fileUrls.logoDataUrl || body.logoDataUrl || body.logo || null,
      stampDataUrl:
        fileUrls.stampDataUrl || body.stampDataUrl || body.stamp || null,
      signatureDataUrl:
        fileUrls.signatureDataUrl ||
        body.signatureDataUrl ||
        body.signature ||
        null,
      signatureName: body.signatureName || "",
      signatureTitle: body.signatureTitle || "",
      notes: body.notes || body.aiSource || "",
    });

    let saved = null;
    let attempts = 0;
    const maxSaveAttempts = 6;
    while (attempts < maxSaveAttempts) {
      try {
        saved = await doc.save();
        break;
      } catch (err) {
        if (
          err &&
          err.code === 11000 &&
          err.keyPattern &&
          err.keyPattern.invoiceNumber
        ) {
          attempts += 1;
          const newNumber = await generateUniqueInvoiceNumber();
          doc.invoiceNumber = newNumber;
          continue;
        }
        throw err;
      }
    }

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: "Failed to create invoice after multiple attempts",
      });
    }

    return res
      .status(201)
      .json({ success: false, message: "Invoice created", data: saved });
  } catch (err) {
    console.error("createInvoice error:", err);
    if (err.type === "entity.too.large") {
      return res
        .status(413)
        .json({ success: false, message: "Payload too large" });
    }
    if (
      err &&
      err.code === 11000 &&
      err.keyPattern &&
      err.keyPattern.invoiceNumber
    ) {
      return res
        .status(409)
        .json({ success: false, message: "Invoice number already exists" });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* ----------------- LIST ALL INVOICES ----------------- */
export async function getInvoices(req, res) {
  try {
    console.log('getInvoices called - Checking auth...');
    
    // FIRST TRY: Use getAuth
    const auth = getAuth(req);
    console.log('getAuth result:', auth);
    
    // SECOND TRY: Check if middleware already set userId
    const userId = auth?.userId || req.auth?.userId;
    console.log('Final userId:', userId);
    
    if (!userId) {
      console.log('No userId found!');
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    console.log('Fetching invoices for userId:', userId);
    
    // Build query
    const query = { owner: userId };
    
    // Add filters if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.search) {
      const search = req.query.search.trim();
      query.$or = [
        { fromEmail: { $regex: search, $options: "i" } },
        { "client.email": { $regex: search, $options: "i" } },
        { "client.name": { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Find invoices
    const invoices = await Invoice.find(query);
    console.log(`Found ${invoices.length} invoices`);
    
    // Sort manually (don't use toSorted on Mongoose results)
    const sortedInvoices = invoices.sort((a, b) => {
      return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
    });

    // Convert to plain objects
    const plainInvoices = sortedInvoices.map(invoice => invoice.toObject());

    return res.status(200).json({
      success: true,
      data: plainInvoices,
    });
  } catch (error) {
    console.error("GET Invoice Error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/* ----------------- GET SINGLE INVOICE ----------------- */
export async function getInvoiceByID(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { id } = req.params;
    
    // Check if it's a valid ObjectId
    let invoice;
    if (isObjectIdString(id)) {
      invoice = await Invoice.findById(id);
    } else {
      invoice = await Invoice.findOne({ invoiceNumber: id });
    }

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Check ownership
    if (invoice.owner && String(invoice.owner) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Not your invoice",
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("GET Invoice By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

/* ----------------- UPDATE INVOICE ----------------- */
export async function updateInvoice(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }
    
    const { id } = req.params;
    const body = req.body || {};

    const query = isObjectIdString(id) 
      ? { _id: id, owner: userId } 
      : { invoiceNumber: id, owner: userId };
    
    const existing = await Invoice.findOne(query);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Validate new invoice number
    if (body.invoiceNumber && String(body.invoiceNumber).trim() !== existing.invoiceNumber) {
      const conflict = await Invoice.findOne({ 
        invoiceNumber: String(body.invoiceNumber).trim() 
      });
      if (conflict && String(conflict._id) !== String(existing._id)) {
        return res.status(409).json({ 
          success: false, 
          message: "Invoice number already exists" 
        });
      }
    }

    // Parse items
    let items = [];
    if (Array.isArray(body.items)) {
      items = body.items;
    } else if (typeof body.items === "string" && body.items.length) {
      try {
        items = JSON.parse(body.items);
      } catch {
        items = [];
      }
    } else if (existing.items) {
      items = existing.items;
    }

    // Calculate totals
    const taxPercent = Number(
      body.taxPercent ?? body.tax ?? body.defaultTaxPercent ?? existing.taxPercent ?? 0
    );
    const totals = computeTotals(items, taxPercent);
    const fileUrls = uploadedFilesToUrls(req);

    // Prepare update object
    const update = {
      invoiceNumber: body.invoiceNumber || existing.invoiceNumber,
      issueDate: body.issueDate || existing.issueDate,
      dueDate: body.dueDate !== undefined ? body.dueDate : existing.dueDate,
      fromBusinessName: body.fromBusinessName || existing.fromBusinessName,
      fromEmail: body.fromEmail || existing.fromEmail,
      fromAddress: body.fromAddress || existing.fromAddress,
      fromPhone: body.fromPhone || existing.fromPhone,
      fromGst: body.fromGst || existing.fromGst,
      client: body.client || existing.client || {},
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: body.currency || existing.currency || "INR",
      status: body.status ? String(body.status).toLowerCase() : existing.status,
      taxPercent,
      logoDataUrl: fileUrls.logoDataUrl || body.logoDataUrl || body.logo || existing.logoDataUrl,
      stampDataUrl: fileUrls.stampDataUrl || body.stampDataUrl || body.stamp || existing.stampDataUrl,
      signatureDataUrl: fileUrls.signatureDataUrl || body.signatureDataUrl || body.signature || existing.signatureDataUrl,
      signatureName: body.signatureName || existing.signatureName,
      signatureTitle: body.signatureTitle || existing.signatureTitle,
      notes: body.notes !== undefined ? body.notes : existing.notes,
    };

    // Remove undefined fields
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const updated = await Invoice.findOneAndUpdate(
      { _id: existing._id },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(500).json({
        success: false,
        message: "Failed to update invoice"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: updated
    });
  } catch (err) {
    console.error("updateInvoice error:", err);
    if (err && err.code === 11000 && err.keyPattern && err.keyPattern.invoiceNumber) {
      return res.status(409).json({ 
        success: false, 
        message: "Invoice number already exists" 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
}

/* ----------------- DELETE INVOICE ----------------- */
export async function deleteInvoice(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }
    
    const { id } = req.params;

    const query = isObjectIdString(id) 
      ? { _id: id, owner: userId } 
      : { invoiceNumber: id, owner: userId };
    
    const existing = await Invoice.findOne(query);
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    await Invoice.deleteOne({ _id: existing._id });
    
    return res.status(200).json({
      success: true,
      message: "Invoice deleted"
    });
  } catch (error) {
    console.error("Delete Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}