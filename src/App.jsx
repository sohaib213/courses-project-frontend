import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/layout/Navbar";
import { useAppDispatch } from "./redux/hooks";
import { checkAuth } from "./redux/slices/authSlice";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check if user is already logged in on app load
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <AppRoutes />
        </main>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
