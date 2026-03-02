import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock3, XCircle, AlertTriangle } from "lucide-react";
import { cartService } from "../services/cartService";

const Payment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const successFlag = searchParams.get("success");
  const [isLoading, setIsLoading] = useState(successFlag === "true");
  const [latestPayment, setLatestPayment] = useState(null);

  const status = useMemo(() => {
    if (successFlag === "false") return "Canceled";
    return latestPayment?.status || (successFlag === "true" ? "Pending" : null);
  }, [successFlag, latestPayment]);

  useEffect(() => {
    if (successFlag !== "true") return;

    let active = true;
    let attempts = 0;
    const maxAttempts = 8;

    const poll = async () => {
      try {
        const payments = await cartService.getPayments();
        const list = Array.isArray(payments) ? payments : [];
        const sorted = [...list].sort((a, b) => {
          const da = new Date(a.created_at || a.finalized_at || 0).getTime();
          const db = new Date(b.created_at || b.finalized_at || 0).getTime();
          return db - da;
        });
        const payment = sorted[0] || null;
        if (!active) return;
        setLatestPayment(payment);

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
  }, [successFlag]);

  useEffect(() => {
    if (!isLoading && status === "Paid") {
      navigate("/my-courses", { replace: true });
    }
  }, [isLoading, status, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center p-4">
      <div className="card max-w-xl w-full text-center">
        {isLoading ? (
          <>
            <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 mx-auto flex items-center justify-center mb-4">
              <Clock3 className="h-8 w-8 text-yellow-600 dark:text-yellow-400 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Confirming payment...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              We are waiting for Stripe confirmation. This may take a few seconds.
            </p>
          </>
        ) : status === "Paid" ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment successful
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You are now enrolled in the purchased courses.
            </p>
            <Link to="/my-courses" className="btn-primary inline-flex">
              Go to My Courses
            </Link>
          </>
        ) : status === "Canceled" ? (
          <>
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-800 mx-auto flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment canceled
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your cart is still available. You can checkout again anytime.
            </p>
            <Link to="/cart" className="btn-secondary inline-flex">
              Back to Cart
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment not completed
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We could not confirm your payment yet. Please check cart/payments and try again.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/cart" className="btn-secondary inline-flex">
                Back to Cart
              </Link>
              <Link to="/my-courses" className="btn-outline inline-flex">
                My Courses
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Payment;
