import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./style.css";
import { HomeFilled } from "@ant-design/icons";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.h1
            className="text-9xl font-bold text-white mb-8"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2,
            }}
          >
            404
          </motion.h1>

          <motion.h2
            className="text-3xl font-semibold text-white mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Oops! Page not found
          </motion.h2>

          <motion.p
            className="text-lg text-white/80 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            The page you are looking for might have been removed or is
            temporarily unavailable.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              type="primary"
              size="large"
              icon={<HomeFilled className="w-5 h-5" />}
              onClick={() => navigate("/")}
              className="home-button"
            >
              Back to Home
            </Button>
          </motion.div>
        </motion.div>
        {/* <ParticleBackground /> */}
      </div>
    </div>
  );
};

export default NotFound;
