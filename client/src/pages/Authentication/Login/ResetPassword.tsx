// NOTE: If you see an error for '@mui/material', run: npm install @mui/material @emotion/react @emotion/styled
import { useState, ChangeEvent, FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Input, Alert, notification } from "antd";
import { resetPassword } from "../../../api/authApi";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, newPassword, confirmPassword);
      setSuccess("Password reset successful! You can now sign in.");
      notification.success({ message: "Password reset successful! You can now sign in." });
      setTimeout(() => {
        navigate('/reset-successful');
      }, 1000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to reset password";
      setError(errorMessage);
      notification.error({ message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <form onSubmit={handleResetPassword} className="w-80">
        <h2 className="m-3">Reset Password</h2>
        <Input
          size="large"
          placeholder="Email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
          style={{ marginBottom: 16 }}
        />
        <Input.Password
          size="large"
          placeholder="New Password"
          value={newPassword}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
          required
          style={{ marginBottom: 16 }}
        />
        <Input.Password
          size="large"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
          required
          style={{ marginBottom: 16 }}
        />
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          style={{ marginTop: 20 }}
        >
          Reset Password
        </Button>
        <h2 className="mt-5">
          <a href="/login">Sign In</a>
        </h2>
        {error && <Alert message={error} type="error" showIcon style={{ marginTop: 16 }} />}
        {success && <Alert message={success} type="success" showIcon style={{ marginTop: 16 }} />}
      </form>
    </div>
  );
};

export default ResetPassword;
