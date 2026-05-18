// NOTE: If you see an error for '@mui/material', run: npm install @mui/material @emotion/react @emotion/styled
import { useState, ChangeEvent, FormEvent } from "react";
import { Button, Input, Alert, notification } from "antd";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../../api/authApi";
import { ReCaptcha } from "../../../components/ReCaptcha";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword(email, recaptchaToken);
      setSuccess("Password reset email sent! Check your inbox.");
      notification.success({ message: "Password reset email sent! Check your inbox." });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to send reset email";
      setError(errorMessage);
      notification.error({ message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-48 text-center justify-center text-lg font-bold flex items-center text-blue-500">
        {/* <LogoIcon style={{ width: "48px" }} /> */}
      </div>
      <h2 className="text-2xl font-bold mt-4 mb-8">StrictlyFriendly</h2>
      <form onSubmit={handleForgotPassword} className="w-80">
        <h2 className="m-3">Forgot Password</h2>
        <Input
          size="large"
          placeholder="Email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
        />
        
        <div className="mt-4 mb-4">
          <ReCaptcha
            siteKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''}
            onVerify={setRecaptchaToken}
            className="flex justify-center"
          />
        </div>

        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          disabled={!recaptchaToken}
          style={{ marginTop: 20, marginBottom: 32 }}
        >
          Send Reset Link
        </Button>
        <Link className="mb-6" to={"/login"}>
          Back to SignIn
        </Link>
        {error && <Alert message={error} type="error" showIcon style={{ marginTop: 16 }} />}
        {success && <Alert message={success} type="success" showIcon style={{ marginTop: 16 }} />}
      </form>
    </div>
  );
};

export default ForgotPassword;
