import React, { useEffect, useState } from "react";
import { aiInvoiceModalStyles } from "../assets/dummyStyles";
import AnimatedButton from "../assets/GenerateBtn/Gbtn";
import GeminiIcon from './GeminiIcon'

const AiInvoiceModal = ({ open, onClose, onGenerate, initiallText = "" }) => {
  const [text, setText] = useState(initiallText || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setText(initiallText || "");
    setError("");
    setLoading(false);
  }, [open, initiallText]); // Added initiallText to dependencies

  if (!open) return null;
  
  async function handleGenerateClick() {
    setError("");
    const raw = (text || "").trim();
    if (!raw) {
      setError("please paste invoice text to genrate from AI.");
      return;
    }
    try {
      setLoading(true);
      const maybePromise = onGenerate && onGenerate(raw);
      if (maybePromise && typeof maybePromise.then === "function") {
        await maybePromise;
      }
    } catch (error) {
      console.error("onGenerate handler failed:", error);
      const msg =
        error &&
        (error.message ||
          (typeof error === "string" ? error : JSON.stringify(error)));
      setError(msg || "failed to generate. try again");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className={aiInvoiceModalStyles.overlay}>
      <div
        className={aiInvoiceModalStyles.backdrop}
        onClick={() => onClose()}
      ></div>

      <div className={aiInvoiceModalStyles.modal}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className={aiInvoiceModalStyles.title}>
              {/* Removed GeminiICon - you might want to add a proper icon here */}
              <GeminiIcon className="w-6 h-6 group-hover:scale-110 transition-transform flex-none" />
              Create Invoice with AI
            </h3>
            <p className={aiInvoiceModalStyles.description}>
              Paste any text that contains invoice details (client, items, qty,
              price) and we'll attempt to extract invoice
            </p>
          </div>
          <button
            onClick={() => onClose && onClose()} // Fixed: onclose -> onClose
            className={aiInvoiceModalStyles.closeButton}
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          <label className={aiInvoiceModalStyles.label}>
            Paste invoice text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`eg. A person wants a logo design for her organic brand "GreenVibe." Quoted for $120 for 2 logo options and final delivery in PNG and vector format`}
            rows={8}
            className={aiInvoiceModalStyles.textarea}
          />
        </div>
        
        {error && (
          <div className={aiInvoiceModalStyles.error} role="alert">
            {String(error)
              .split("\n")
              .map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            {(/quota|exhausted|resource_exhausted/i.test(String(error)) && (
              <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
                Tip: AI is temporarily unavailable (quota). Try again in a few
                minutes, or create the invoice manually.
              </div>
            )) ||
              null}
          </div>
        )}

        <div className={aiInvoiceModalStyles.actions}>
          <AnimatedButton 
            onClick={handleGenerateClick} 
            isLoading={loading} 
            disabled={loading} 
            label="Generate"
          />
        </div>
      </div>
    </div>
  );
};

export default AiInvoiceModal;