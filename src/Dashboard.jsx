import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  useEffect(() => {
    // Check if user is logged in
    const userData = JSON.parse(
      sessionStorage.getItem("user") || localStorage.getItem("user")
    );
    if (!userData) {
      navigate("/signin");
      return;
    }
    setUser(userData);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await axios.post("/api/auth/logout");

      // Clear stored tokens
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");

      // Clear axios default header
      delete axios.defaults.headers.common["Authorization"];

      navigate("/signin");
    } catch (error) {
      console.error("Logout error:", error);
      setMessage("❌ Error logging out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setMessage("❌ New passwords don't match");
      return;
    }

    try {
      setIsLoading(true);
      await axios.post("/api/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setMessage("✅ Password changed successfully!");
      setShowChangePassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error) {
      console.error("Change password error:", error);
      setMessage(error.response?.data?.error || "❌ Error changing password");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8">
            <h2 className="text-3xl font-bold text-white">
              Welcome, {user.username}!
            </h2>
            <p className="text-orange-100 mt-2">Manage your account settings</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="flex-1 bg-orange-100 text-orange-700 px-6 py-3 rounded-lg font-semibold hover:bg-orange-200 transition-colors"
              >
                Change Password
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="flex-1 bg-red-100 text-red-700 px-6 py-3 rounded-lg font-semibold hover:bg-red-200 transition-colors"
              >
                {isLoading ? "Logging out..." : "Logout"}
              </button>
            </div>

            {/* Change Password Form */}
            {showChangePassword && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmNewPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmNewPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                  >
                    {isLoading ? "Changing Password..." : "Update Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Messages */}
            {message && (
              <div
                className={`p-4 rounded-lg text-center font-medium ${
                  message.includes("✅")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
