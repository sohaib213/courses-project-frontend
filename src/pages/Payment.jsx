import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  XCircle,
  AlertTriangle,
  CreditCard,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { cartService } from "../services/cartService";

const Payment = () => {
  const [searchParams] = useSearchParams();
  const successFlag = searchParams.get("success");
  const [isLoading, setIsLoading] = useState(successFlag === "true");
  const [isFetchingPayments, setIsFetchingPayments] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [latestPayment, setLatestPayment] = useState(null);
  const [payments, setPayments] = useState([]);

  const sortPayments = useCallback((list) => {
    const normalized = Array.isArray(list) ? list : [];
    return [...normalized].sort((a, b) => {
      const da = new Date(a.created_at || a.finalized_at || 0).getTime();
      const db = new Date(b.created_at || b.finalized_at || 0).getTime();
      return db - da;
    });
  }, []);

  const loadPayments = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          setIsFetchingPayments(true);
          setFetchError("");
        }

        const response = await cartService.getPayments();
        const sorted = sortPayments(response);
        setPayments(sorted);
        setLatestPayment(sorted[0] || null);
        return sorted;
      } catch (error) {
        if (!silent) {
          setFetchError(
            error?.response?.data?.message || "Failed to load payments.",
          );
        }
        return [];
      } finally {
        if (!silent) setIsFetchingPayments(false);
      }
    },
    [sortPayments],
  );

  const status = useMemo(() => {
    if (successFlag === "false") return "Canceled";
    return latestPayment?.status || (successFlag === "true" ? "Pending" : null);
  }, [successFlag, latestPayment]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    if (successFlag !== "true") return;

    let active = true;
    let attempts = 0;
    const maxAttempts = 8;

    const poll = async () => {
      try {
        const sorted = await loadPayments({ silent: true });
        const payment = sorted[0] || null;
        if (!active) return;

        if (payment?.status === "Paid" || payment?.status === "Failed") {
          setIsLoading(false);
          return;
        }
      } catch {
        // keep polling briefly
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        if (active) setIsLoading(false);
        return;
      }
      setTimeout(poll, 2500);
    };

    poll();
    return () => {
      active = false;
    };
  }, [loadPayments, successFlag]);

  const formatAmount = (value) => {
    const amount = typeof value === "string" ? parseFloat(value) : Number(value);
    if (Number.isNaN(amount)) return "--";
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString();
  };

  const badgeClasses = (paymentStatus) => {
    const normalized = String(paymentStatus || "Pending").toLowerCase();

    if (normalized === "paid") {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    }
    if (normalized === "failed") {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    }
    if (normalized === "canceled") {
      return "bg-gray-200 text-gray-700 dark:bg-dark-700 dark:text-gray-300";
    }

    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Payments
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your previous payments and checkout status.
            </p>
          </div>

          <button
            onClick={() => loadPayments()}
            className="btn-secondary !py-2 inline-flex items-center gap-2 self-start"
            disabled={isFetchingPayments}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetchingPayments ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {successFlag && (
          <div className="card mb-6">
            {isLoading ? (
              <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-300">
                <Clock3 className="h-5 w-5 animate-pulse" />
                <p>Confirming your latest payment with Stripe...</p>
              </div>
            ) : status === "Paid" ? (
              <div className="flex items-center gap-3 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-5 w-5" />
                <p>Payment successful. Your courses are now available.</p>
              </div>
            ) : status === "Canceled" ? (
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <XCircle className="h-5 w-5" />
                <p>Payment was canceled. Your cart is still available.</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
                <AlertTriangle className="h-5 w-5" />
                <p>Payment not completed yet. You can try checkout again.</p>
              </div>
            )}
          </div>
        )}

        <div className="card overflow-hidden">
          {isFetchingPayments ? (
            <div className="py-16 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Loading payment history...
              </p>
            </div>
          ) : fetchError ? (
            <div className="py-12 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{fetchError}</p>
              <button onClick={() => loadPayments()} className="btn-secondary !py-2">
                Try Again
              </button>
            </div>
          ) : payments.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-dark-800 mx-auto flex items-center justify-center mb-3">
                <CreditCard className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No payments yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-5">
                Your completed and pending payments will appear here.
              </p>
              <Link to="/cart" className="btn-primary inline-flex !py-2">
                Go to Cart
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50 dark:bg-dark-800">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Payment ID
                    </th>
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Amount
                    </th>
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Created
                    </th>
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Finalized
                    </th>
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-t border-gray-100 dark:border-dark-800"
                    >
                      <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono">
                        {payment.id}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-900 dark:text-white font-semibold">
                        {formatAmount(payment.amount)}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClasses(
                            payment.status,
                          )}`}
                        >
                          {payment.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(payment.finalized_at)}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {payment?.cart_id ? (
                          <Link
                            to={`/payment/${payment.id}`}
                            className="inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:underline font-medium"
                          >
                            View courses
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;
