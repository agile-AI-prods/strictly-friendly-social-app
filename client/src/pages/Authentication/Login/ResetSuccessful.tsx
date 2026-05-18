import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const ResetSuccessful = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Result
        status="success"
        title="Password Reset Successful!"
        subTitle="Your password has been updated. You can now sign in with your new password."
        extra={[
          <Button type="primary" key="login" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        ]}
      />
    </div>
  );
};

export default ResetSuccessful;
