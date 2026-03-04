import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard, BookOpen, AlertTriangle } from "lucide-react";
import { cartService } from "../services/cartService";
import defaultCoursePhoto from "../../src/assets/default_course_photo.jpg";

const PaymentDetails = () => {
  const { paymentId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [coursesError, setCoursesError] = useState("");

  useEffect(() => {
    const loadPaymentDetails = async () => {
      try {
        setIsLoading(true);
        setError("");
        setCoursesError("");

        const payments = await cartService.getPayments();
        const list = Array.isArray(payments) ? payments : [];
        const selectedPayment = list.find((p) => p?.id === paymentId) || null;

        if (!selectedPayment) {
          setError("Payment not found.");
          return;
        }

        setPayment(selectedPayment);

        const embeddedItems =
          selectedPayment?.carts?.cart_items || selectedPayment?.cart_items;

        if (Array.isArray(embeddedItems) && embeddedItems.length > 0) {
          setItems(embeddedItems);
          return;
        }

        if (!selectedPayment?.cart_id) {
          setCoursesError("No cart is linked to this payment.");
          return;
        }

        try {
          const cartItems = await cartService.getCartItemsByCartId(
            selectedPayment.cart_id,
          );
          const normalizedItems = Array.isArray(cartItems) ? cartItems : [];
          setItems(normalizedItems);
        } catch (itemsError) {
          const status = itemsError?.response?.status;
          if (status === 404) {
            setCoursesError(
              "Courses endpoint is not available yet. Add GET /carts/:cartId/items in backend to show purchased courses.",
            );
          } else {
            setCoursesError(
              itemsError?.response?.data?.message ||
                "Failed to load courses for this payment.",
            );
          }
        }
      } catch (loadError) {
        setError(loadError?.response?.data?.message || "Failed to load payment.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentDetails();
  }, [paymentId]);

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

  const normalizedCourses = useMemo(() => {
    return items
      .map((item) => {
        const course = item?.courses || item?.course || null;
        if (!course) return null;
        return { ...course, cartItemId: item?.id };
      })
      .filter(Boolean);
  }, [items]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading payment details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/payment"
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Payments
          </Link>
          <div className="card text-center py-12">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/payment"
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payments
        </Link>

        <div className="card mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Payment Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 font-mono text-sm break-all">
                {payment?.id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {formatAmount(payment?.amount)}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-800">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </p>
              <p className="font-semibold text-gray-900 dark:text-white mt-1">
                {payment?.status || "Pending"}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-800">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Created
              </p>
              <p className="font-semibold text-gray-900 dark:text-white mt-1">
                {formatDate(payment?.created_at)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-800">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Finalized
              </p>
              <p className="font-semibold text-gray-900 dark:text-white mt-1">
                {formatDate(payment?.finalized_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            Courses in this payment
          </h2>

          {coursesError ? (
            <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p>{coursesError}</p>
            </div>
          ) : normalizedCourses.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-dark-800 mx-auto flex items-center justify-center mb-3">
                <CreditCard className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                No courses found for this payment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {normalizedCourses.map((course) => {
                const price =
                  typeof course.price === "string"
                    ? parseFloat(course.price)
                    : Number(course.price);
                const isFree = !course.price || course.price === "0" || price === 0;

                return (
                  <div
                    key={course.cartItemId || course.id}
                    className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 rounded-xl border border-gray-100 dark:border-dark-800"
                  >
                    <Link
                      to={`/courses/${course.id}`}
                      className="w-full sm:w-48 h-28 rounded-xl overflow-hidden flex-shrink-0"
                    >
                      <img
                        src={course.thumbnail_url}
                        alt={defaultCoursePhoto}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = defaultCoursePhoto;
                        }}
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/courses/${course.id}`}
                        className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2"
                      >
                        {course.title}
                      </Link>
                      {course.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {course.description}
                        </p>
                      )}
                    </div>
                    <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
                      {isFree ? "Free" : `$${Number.isNaN(price) ? "--" : price.toFixed(2)}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
