import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Trash2,
  CreditCard,
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { cartService } from "../services/cartService";
import defaultCoursePhoto from "../../src/assets/default_course_photo.jpg";

const Cart = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [removingItemId, setRemovingItemId] = useState(null);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      const response = await cartService.getActiveCartItems();

      // Backend now returns cart_items with nested 'courses' object
      const cartItems = response.data || response;
      const normalizedItems = Array.isArray(cartItems) ? cartItems : [];

      setItems(normalizedItems);
    } catch (error) {
      console.error("Failed to load cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  // Calculate total from nested course data
  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const course = item?.courses; // Backend includes course data
      if (!course?.price) return sum;

      const price =
        typeof course.price === "string"
          ? parseFloat(course.price)
          : Number(course.price);

      return sum + (isNaN(price) ? 0 : price);
    }, 0);
  }, [items]);

  const handleRemove = async (itemId) => {
    try {
      setRemovingItemId(itemId);
      await cartService.removeItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success("Item removed from cart");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to remove cart item";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      setIsCheckingOut(true);
      const response = await cartService.pay();
      const session = response.data || response;

      if (session?.url) {
        window.location.href = session.url;
        return;
      }

      toast.error("Checkout session URL is missing");
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to checkout";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary-600 dark:text-primary-400 animate-pulse" />
          </div>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 font-medium">
            Loading your cart...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 dark:from-primary-900 dark:via-purple-900 dark:to-pink-900">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm font-medium">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Your Cart</h1>
            <p className="text-xl text-white/90 dark:text-white/80">
              Review your courses and complete your purchase
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="card text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-12 w-12 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Explore our course catalog and add courses you want to learn
            </p>
            <button
              onClick={() => navigate("/courses")}
              className="btn-primary inline-flex items-center gap-2"
            >
              <BookOpen className="h-5 w-5" />
              Browse Courses
            </button>
          </div>
        ) : (
          /* Cart Items + Summary */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const course = item.courses; // Backend includes nested course

                if (!course) {
                  // Handle missing course data gracefully
                  return (
                    <div
                      key={item.id}
                      className="card bg-red-50 dark:bg-red-900/20"
                    >
                      <p className="text-red-600 dark:text-red-400">
                        Course data unavailable for item {item.id}
                      </p>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="btn-secondary mt-2"
                      >
                        Remove Item
                      </button>
                    </div>
                  );
                }

                const price =
                  typeof course.price === "string"
                    ? parseFloat(course.price)
                    : Number(course.price);

                const isFree =
                  !course.price || course.price === "0" || price === 0;

                return (
                  <div
                    key={item.id}
                    className="card flex flex-col sm:flex-row gap-4 items-start sm:items-center group hover:shadow-lg transition-shadow"
                  >
                    {/* Course Thumbnail */}
                    <Link
                      to={`/courses/${course.id}`}
                      className="relative overflow-hidden rounded-xl w-full sm:w-48 h-28 flex-shrink-0"
                    >
                      <img
                        src={course.thumbnail_url}
                        alt={defaultCoursePhoto}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = defaultCoursePhoto;
                        }}
                      />
                    </Link>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/courses/${course.id}`}
                        className="text-lg font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2 mb-1"
                      >
                        {course.title}
                      </Link>

                      {course.teacher && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          by {course.teacher.username || course.teacher.email}
                        </p>
                      )}

                      {course.category && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded">
                          {course.category.name}
                        </span>
                      )}
                    </div>

                    {/* Price & Remove Button */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {isFree ? (
                            <span className="text-green-600 dark:text-green-400">
                              Free
                            </span>
                          ) : (
                            `$${price.toFixed(2)}`
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removingItemId === item.id}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove from cart"
                      >
                        {removingItemId === item.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Order Summary
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span>Courses</span>
                    <span className="font-semibold">{items.length}</span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span className="font-semibold">${total.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-gray-200 dark:border-dark-700 pt-3 flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      Total
                    </span>
                    <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || items.length === 0}
                  className="btn-primary w-full !py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-500">
                  Secure payment powered by Stripe 🔒
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
