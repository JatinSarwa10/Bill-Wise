import React, { useCallback, useEffect, useMemo } from "react";
import { dashboardStyles } from "../assets/dummyStyles";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";
import KpiCard from "../components/KpiCard";
import StatusBadge from "../components/StatusBadge";

 const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function currencyFmt(amount = 0, currency = "INR") {
  try {
    const n = Number(amount || 0);
    if (currency === "INR")
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(n);
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `${currency} ${amount}`;
  }
}

/* helpers to format icons */
const TrendingUpIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M23 6l-9.5 9.5-5-5L1 18" />
    <path d="M17 6h6v6" />
  </svg>
);
const DollarIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const FileTextIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const EyeIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const PlusIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const BusinessIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
  </svg>
);
const ArrowRightIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

function capitalize(s) {
  if (!s) return s;
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

function formatDate(dateInput) {
  if (!dateInput) return "—";
  const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();

  const obtainToken = useCallback(async () => {
    if (!isSignedIn) {
      return null;
    }

    if (typeof getToken !== "function") {
      return null;
    }

    try {
      const token = await getToken();
      return token;
    } catch (err) {
      console.error("Token fetch error:", err);
      return null;
    }
  }, [getToken, isSignedIn]);

  const [storedInvoices, setStoredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await obtainToken();
      const headers = { Accept: "application/json" };

      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/invoice`, {
        method: "GET",
        headers,
      });
      const json = await res.json().catch(() => null);
     if (res.status === 401) {
        // unauthorized - prompt login
        setError("Unauthorized. Please sign in.");
        setStoredInvoices([]);
        return;
      }

      if (!res.ok) {
        const msg = json?.message || `Failed to fetch (${res.status})`;
        throw new Error(msg);
      }

      const raw = json?.data || [];
      const mapped = (Array.isArray(raw) ? raw : []).map((inv) => {
        const clientObj = inv.client ?? {};
        const amountVal = Number(inv.total ?? inv.amount ?? 0);
        const currency = (inv.currency || "INR").toUpperCase();

        return {
          ...inv,
          id: inv.invoiceNumber || inv._id || String(inv._id || ""),
          client: clientObj,
          amount: amountVal,
          currency,
          // keep status normalized
          status:
            typeof inv.status === "string"
              ? capitalize(inv.status)
              : inv.status || "Draft",
        };
      });
      setStoredInvoices(mapped);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setError(err?.message || "Failed to load invoices");
      setStoredInvoices([]);
    } 
    finally{
      setLoading(false);
    }
  },[obtainToken]);

  //fetch the user profile
  const fetchBusinessProfile = useCallback(async()=>{
    try {
      const token = await obtainToken();
      if(!token) return;
      const res = await fetch(`${API_BASE}/api/businessProfile/me`,{
        method: "GET",
        headers:{
          Authorization: `Bearer ${token}`,
          Accept:"application/json",
        }
      })
      if (res.status === 401) {
        // silently ignore; profile not available
        return;
      }
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const data = json?.data || null;
      if (data) setBusinessProfile(data);
    } catch (err) {
      // non-fatal
      console.warn("Failed to fetch business profile:", err);
    }
  }, [obtainToken]);
  

  useEffect(() => {
    if (isSignedIn) {
      fetchInvoices();
      fetchBusinessProfile();
    } 
    // else {
    //   setLoading(false);
    //   setError("Please sign in to view dashboard");
    //   setStoredInvoices([]);
    // }

    function onStorage(e) {
      if (e.key === "invoice_v1") {
        fetchInvoices();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchInvoices, fetchBusinessProfile, isSignedIn]);

  const HARD_RATES = {
    USD_TO_INR: 90,
  };

  function convertToINR(amount = 0, currency = "INR") {
    const n = Number(amount || 0);
    const curr = String(currency || "INR")
      .trim()
      .toUpperCase();

    if (curr === "INR") return n;
    if (curr === "USD") return n * HARD_RATES.USD_TO_INR;
    return n;
  }

  const kpis = useMemo(() => {
    const totalInvoices = storedInvoices.length;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let totalAmountAll = 0;

    storedInvoices.forEach((inv) => {
      const rawAmount =
        typeof inv.amount === "number"
          ? inv.amount
          : Number(inv.total ?? inv.amount ?? 0);
      const invCurrency = inv.currency || "INR";
      const amtInINR = convertToINR(rawAmount, invCurrency);
      totalAmountAll += amtInINR;

      if (inv.status === "Paid") {
        totalPaid += amtInINR;
        paidCount++;
      }
      if (inv.status === "Unpaid" || inv.status === "Overdue") {
        totalUnpaid += amtInINR;
        unpaidCount++;
      }
    });

    const totalAmount = totalPaid + totalUnpaid;
    const paidPercentage =
      totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
    const unpaidPercentage =
      totalAmount > 0 ? (totalUnpaid / totalAmount) * 100 : 0;
    const avgInvoice = totalInvoices > 0 ? totalAmountAll / totalInvoices : 0;
    const paidRate = totalInvoices > 0 ? (paidCount / totalInvoices) * 100 : 0;

    return {
      totalInvoices,
      totalPaid,
      totalUnpaid,
      paidCount,
      unpaidCount,
      paidPercentage,
      unpaidPercentage,
      totalAmountAll,
      avgInvoice,
      paidRate,
    };
  }, [storedInvoices]);

  const recent = useMemo(() => {
    return storedInvoices
      .slice()
      .sort(
        (a, b) =>
          (Date.parse(b.issueDate || 0) || 0) -
          (Date.parse(a.issueDate || 0) || 0)
      )
      .slice(0, 5);
  }, [storedInvoices]);

  const getClientName = (inv) => {
    if (!inv) return "";
    if (typeof inv.client === "string") return inv.client;
    if (typeof inv.client === "object")
      return inv.client?.name || inv.client?.company || inv.company || "";
    return inv.company || "Client";
  };

  const getClientInitial = (inv) => {
    const clientName = getClientName(inv);
    return clientName ? clientName.charAt(0).toUpperCase() : "C";
  };
  function openInvoice(invRow) {
    const payload = invRow;
    navigate(`/app/invoices/${invRow.id}`, { state: { invoice: payload } });
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "unpaid":
        return "bg-red-100 text-red-800";
      case "overdue":
        return "bg-orange-100 text-orange-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={dashboardStyles.pageContainer}>
      <div className={dashboardStyles.headerContainer}>
        <h1 className={dashboardStyles.headerTitle}>Dashboard Overview</h1>
        <p className={dashboardStyles.headerSubtitle}>
          Track your invoicing performance and business insights
        </p>
      </div>

      {loading ? (
        <div className="p-6">Loading invoices...</div>
      ) : error ? (
        <div className="p-6">
          <div className="text-red-600 mb-3">Error: {error}</div>
          <div className="flex gap-2">
            <button
              onClick={fetchInvoices}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Retry
            </button>
            {String(error).toLowerCase().includes("unauthorized") && (
              <button
                onClick={() => navigate("/login")}
                className="px-3 py-1 bg-gray-700 text-white rounded"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      ) : null}
      <div className={dashboardStyles.kpiGrid}>
        <KpiCard
          title="Total Invoices"
          value={kpis.totalInvoices}
          hint="Active invoices"
          iconType="document"
          trend={8.5}
        />
        <KpiCard
          title="Total Paid"
          value={currencyFmt(kpis.totalPaid, "INR")}
          hint="Received amount (INR)"
          iconType="document"
          trend={8.5}
        />
        <KpiCard
          title="Total Unpaid"
          value={currencyFmt(kpis.totalUnpaid, "INR")}
          hint="Outstanding balance (INR)"
          iconType="clock"
          trend={-3.1}
        />
      </div>
      <div className={dashboardStyles.mainGrid}>
        <div className={dashboardStyles.sidebarColumn}>
          <div className={dashboardStyles.quickStatsCard}>
            <h3 className={dashboardStyles.quickStatsTitle}>Quick Stats</h3>
            <div className="space-y-3">
              <div className={dashboardStyles.quickStatsRow}>
                <span className={dashboardStyles.quickStatsLabel}>
                  Paid Rate
                </span>
                <span className={dashboardStyles.quickStatsValue}>
                  {kpis.totalInvoices > 0
                    ? ((kpis.paidCount / kpis.totalInvoices) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className={dashboardStyles.quickStatsRow}>
                <span className={dashboardStyles.quickStatsLabel}>
                  Avg. Invoice
                </span>
                <span className={dashboardStyles.quickStatsValue}>
                  {currencyFmt(
                    kpis.totalInvoices > 0
                      ? (kpis.totalPaid + kpis.totalUnpaid) / kpis.totalInvoices
                      : 0,
                    "INR"
                  )}
                </span>
              </div>
              <div className={dashboardStyles.quickStatsRow}>
                <span className={dashboardStyles.quickStatsLabel}>
                  Collection Eff.
                </span>
                <span className={dashboardStyles.quickStatsValue}>
                  {kpis.paidPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* quick action */}
          <div className={dashboardStyles.cardContainer}>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className={dashboardStyles.quickActionsContainer}>
                <button
                  onClick={() => navigate("/app/create-invoice")}
                  className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionBlue}`}
                >
                  <div
                    className={`${dashboardStyles.quickActionIconContainer} ${dashboardStyles.quickActionIconBlue}`}
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14m-7-7h14" />
                    </svg>
                  </div>
                  <span className={dashboardStyles.quickActionText}>
                    Create Invoice
                  </span>
                </button>

                <button
                  onClick={() => navigate("/app/invoices")}
                  className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionGray}`}
                >
                  <div
                    className={`${dashboardStyles.quickActionIconContainer} ${dashboardStyles.quickActionIconGray}`}
                  >
                    <FileTextIcon className="w-4 h-4" />
                  </div>
                  <span className={dashboardStyles.quickActionText}>
                    View All Invoices
                  </span>
                </button>

                <button
                  onClick={() => navigate("/app/business")}
                  className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionGray}`}
                >
                  <div
                    className={`${dashboardStyles.quickActionIconContainer} ${dashboardStyles.quickActionIconGray}`}
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className={dashboardStyles.quickActionText}>
                    Business Profile
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={dashboardStyles.contentColumn}>
          <div className={dashboardStyles.cardContainerOverflow}>
            <div className={dashboardStyles.tableHeader}>
              <div className={dashboardStyles.tableHeaderContent}>
                <div>
                  <h3 className={dashboardStyles.tableTitle}>
                    Recent Invoices
                  </h3>
                  <p className={dashboardStyles.tableSubtitle}>
                    Latest 5 invoices from your account
                  </p>
                </div>
                <button
                  onClick={() => navigate("/app/invoices")}
                  className={dashboardStyles.tableActionButton}
                >
                  View All{" "}
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14m-7-7l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={dashboardStyles.tableContainer}>
              <table className={dashboardStyles.table}>
                <thead>
                  <tr className={dashboardStyles.tableHead}>
                    <th className={dashboardStyles.tableHeaderCell}>
                      Client & ID
                    </th>
                    <th className={dashboardStyles.tableHeaderCell}>Amount</th>
                    <th className={dashboardStyles.tableHeaderCell}>Status</th>
                    <th className={dashboardStyles.tableHeaderCell}>
                      Due Date
                    </th>
                    <th className={dashboardStyles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody className={dashboardStyles.tableBody}>
                  {recent.map((inv) => {
                    const clientName = getClientName(inv);
                    const clientInitial = getClientInitial(inv);

                    return (
                      <tr
                        key={inv.id}
                        className={dashboardStyles.tableRow}
                        onClick={() => openInvoice(inv)}
                      >
                        <td className={dashboardStyles.tableCell}>
                          <div className="flex items-center gap-3">
                            <div className={dashboardStyles.clientAvatar}>
                              {clientInitial}
                            </div>
                            <div>
                              <div className={dashboardStyles.clientInfo}>
                                {clientName}
                              </div>
                              <div className={dashboardStyles.clientSubInfo}>
                                {inv.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={dashboardStyles.tableCell}>
                          <div className={dashboardStyles.amountCell}>
                            {currencyFmt(inv.amount, inv.currency)}
                          </div>
                        </td>
                        <td className={dashboardStyles.tableCell}>
                          <StatusBadge
                            status={inv.status}
                            size="default"
                            showIcon={true}
                          />
                        </td>
                        <td className={dashboardStyles.tableCell}>
                          <div className={dashboardStyles.dateCell}>
                            {inv.dueDate ? formatDate(inv.dueDate) : "-"}
                          </div>
                        </td>

                        <td className={dashboardStyles.tableCell}>
                          <div className="text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInvoice(inv);
                              }}
                              className={dashboardStyles.actionButton}
                            >
                              <EyeIcon className="w-4 h-4 group=hover/btn:scale-110 transition-transform" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {recent.length === 0 && !loading && (
                    <tr>
                      <td colSpan="5" className={dashboardStyles.emptyState}>
                        <div className={dashboardStyles.emptyStateText}>
                          <FileTextIcon
                            className={dashboardStyles.emptyStateIcon}
                          />
                          <div className={dashboardStyles.emptyStateMessage}>
                            No invoice yet
                          </div>
                          <button
                            onClick={() => navigate("/app/create-invoice")}
                            className={dashboardStyles.emptyStateAction}
                          >
                            Create Your First Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
