import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

// Configure axios defaults
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
axios.defaults.headers.common["Content-Type"] = "application/json";

function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    firstName: "",
    lastName: "",
  });

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);

  const navigate = useNavigate(); // Initialize useNavigate

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (
      registeredUsers.some((user) => user.username === formData.username)
    ) {
      newErrors.username = "Username already exists";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email format is invalid";
    } else if (registeredUsers.some((user) => user.email === formData.email)) {
      newErrors.email = "Email already registered";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const formErrors = validateForm();
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      setMessage("❌ Please fix the errors above");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for API
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      // Make API call to register user
      const response = await axios.post("/api/auth/register", registrationData);

      // Handle successful registration
      if (response.status === 201 || response.status === 200) {
        const newUser = response.data.user || response.data;

        setRegisteredUsers((prev) => [...prev, newUser]);
        setMessage("🎉 Registration successful! Welcome aboard!");

        // Reset form
        setFormData({
          username: "",
          password: "",
          confirmPassword: "",
          email: "",
          firstName: "",
          lastName: "",
        });

        console.log("User registered:", newUser);

        // Optional: Auto-redirect after successful registration
        // setTimeout(() => {
        //   window.location.href = '/login';
        // }, 2000);

        navigate("/dashboard"); // Add this line
      }
    } catch (error) {
      console.error("Registration error:", error);

      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;

        if (status === 400) {
          // Handle validation errors from server
          if (data.errors) {
            setErrors(data.errors);
          }
          setMessage(
            data.message ||
              "❌ Registration failed. Please check your information."
          );
        } else if (status === 409) {
          // Handle duplicate user errors
          setMessage("❌ Username or email already exists.");
        } else if (status === 500) {
          setMessage("❌ Server error. Please try again later.");
        } else {
          setMessage("❌ Registration failed. Please try again.");
        }
      } else if (error.request) {
        // Network error
        setMessage(
          "❌ Network error. Please check your connection and try again."
        );
      } else {
        // Other error
        setMessage("❌ An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8">
          <h2 className="text-3xl font-bold text-white text-center">
            Create Account
          </h2>
          <p className="text-orange-100 text-center mt-2">
            Join our community today
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-8">
          <div className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.firstName
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-orange-400"
                  }`}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.lastName
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-orange-400"
                  }`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Username
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
                placeholder="Choose a unique username"
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.email
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-orange-400"
                }`}
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
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
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.password
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-orange-400"
                }`}
                placeholder="Create a strong password"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Must be 6+ characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.confirmPassword
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-orange-400"
                }`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Register Button */}
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
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </div>

          {/* Success/Error Messages */}
          {message && (
            <div
              className={`mt-6 p-4 rounded-lg text-center font-medium ${
                message.includes("successful") || message.includes("🎉")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* Registered Users Count */}
          {registeredUsers.length > 0 && (
            <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-orange-700 text-sm text-center">
                🎉 {registeredUsers.length} user
                {registeredUsers.length !== 1 ? "s" : ""} registered
                successfully!
              </p>
            </div>
          )}

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <Link
                to="/signin" // Change this path if your SignUp route is different
                className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
