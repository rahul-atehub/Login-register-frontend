import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

// Configure axios defaults
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
axios.defaults.headers.common["Content-Type"] = "application/json";

function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    setMessage("");
  };

  // const validateForm = () => {
  //   const newErrors = {};

  //   // Username/Email validation
  //   if (!formData.username.trim()) {
  //     newErrors.username = "Username or email is required";
  //   }

  //   // Password validation
  //   if (!formData.password) {
  //     newErrors.password = "Password is required";
  //   } else if (formData.password.length < 6) {
  //     newErrors.password = "Password must be at least 6 characters";
  //   }

  //   return newErrors;
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      // Log the request payload
      console.log("Sending login request:", {
        username: formData.username,
        passwordLength: formData.password?.length,
      });

      const response = await axios.post("/api/auth/login", {
        username: formData.username,
        password: formData.password,
      });

      console.log("Login response:", response.data);

      if (response.data.token) {
        // Store token
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("authToken", response.data.token);
        storage.setItem("user", JSON.stringify(response.data.user));

        // Set axios default header
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;

        setMessage("🎉 Login successful!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        // Handle different status codes
        switch (error.response.status) {
          case 401:
            setMessage("❌ Invalid username or password");
            break;
          case 404:
            setMessage("❌ User not found");
            break;
          default:
            setMessage(
              "❌ Login failed: " +
                (error.response.data.error || "Unknown error")
            );
        }
      } else if (error.request) {
        setMessage("❌ Network error. Please check your connection.");
      } else {
        setMessage("❌ An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/api/auth/guest");

      const { user, token } = response.data;

      // Store in sessionStorage (not localStorage since it's temporary)
      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("user", JSON.stringify(user));

      // Set axios default auth header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setMessage("🎉 Logged in as Guest!");

      // Optional: redirect after short delay
      // setTimeout(() => {
      //   navigate("/dashboard");
      // }, 1000);
    } catch (error) {
      console.error("Guest login error:", error);
      setMessage("❌ Failed to login as guest. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load Google Identity Services script
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Load script if not already present
    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = "google-gsi-script";
      script.onload = () => {
        if (window.google && googleClientId) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
          });

          window.google.accounts.id.renderButton(
            document.getElementById("google-signin-button"),
            { theme: "outline", size: "large" }
          );
        }
      };
      document.body.appendChild(script);
    } else {
      if (window.google && googleClientId) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          { theme: "outline", size: "large" }
        );
      }
    }

    // ✅ Define callback globally
    function handleCredentialResponse(response) {
      console.log("Google JWT ID token:", response.credential);

      // 🔐 Example: Send token to backend
      axios
        .post("/api/auth/google-login", {
          token: response.credential,
        })
        .then((res) => {
          const { token, user } = res.data;
          sessionStorage.setItem("authToken", token);
          sessionStorage.setItem("user", JSON.stringify(user));
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          setMessage("🎉 Google Login successful!");
          navigate("/dashboard");
        })
        .catch((err) => {
          console.error("Google login failed", err);
          setMessage("❌ Google login failed. Try again.");
        });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8">
          <h2 className="text-3xl font-bold text-white text-center">
            Welcome Back
          </h2>
          <p className="text-orange-100 text-center mt-2">
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-8">
          <div className="space-y-6">
            {/* Username/Email Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Username or Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.username
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-orange-400"
                }`}
                placeholder="Enter your username or email"
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.password
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-orange-400"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-600 transition-colors"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full font-bold py-4 px-6 rounded-lg transition-all duration-200 transform ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:scale-105 active:scale-95"
              } text-white shadow-lg hover:shadow-xl`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-1 place-items-center">
              <div className="flex flex-col items-center w-full">
                <div id="google-signin-button">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.google &&
                        window.google.accounts &&
                        window.google.accounts.id
                      ) {
                        window.google.accounts.id.prompt();
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full shadow hover:shadow-md hover:bg-gray-100 transition"
                  >
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      alt="Google logo"
                      className="w-5 h-5"
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      Sign in with Google
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* ig guess this should work */}
          <button
            type="button"
            onClick={handleGuestLogin}
            className="mt-3 w-full text-center text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-colors"
          >
            Continue as Guest
          </button>

          {/* Success/Error Messages */}
          {message && (
            <div
              className={`mt-6 p-4 rounded-lg text-center font-medium ${
                message.includes("Welcome") || message.includes("🎉")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : message.includes("reset") || message.includes("🔄")
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : message.includes("Demo") || message.includes("📝")
                  ? "bg-orange-50 text-orange-700 border border-orange-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* Demo Users */}

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <Link
                to="/signup" // Change this path if your SignUp route is different
                className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
