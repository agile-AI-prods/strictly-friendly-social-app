const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const { connectToDatabase } = require("./src/config/database");

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy to get real IP addresses
app.set("trust proxy", true);

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Pragma", "Expires"],
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan("dev"));
// API routes
const profileRoutes = require("./src/routes/profileRoutes");
const activityRoutes = require("./src/routes/activityRoutes");
const connectionRoutes = require("./src/routes/connectionRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const followRoutes = require("./src/routes/followRoutes");
const likeRoutes = require("./src/routes/likeRoutes");
const commentRoutes = require("./src/routes/commentRoutes");
const friendRoutes = require("./src/routes/friendRoutes");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const birthdayRoutes = require("./src/routes/birthdayRoutes");
const settingsRoutes = require("./src/routes/settingsRoutes");
const deviceManagementRoutes = require("./src/routes/deviceManagementRoutes");
const typingStatusRoutes = require("./src/routes/typingStatusRoutes");
const callRoutes = require("./src/routes/callRoutes");
const emailVerificationRoutes = require("./src/routes/emailVerificationRoutes");

app.use("/api/profile", profileRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/birthdays", birthdayRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/device-management", deviceManagementRoutes);
app.use("/api/typing-status", typingStatusRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/email-verification", emailVerificationRoutes);

// Error handler
const errorHandler = require("./src/middleware/errorHandler");
app.use(errorHandler);

// Serve uploaded files
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));

// Serve frontend static files
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// HTTPS if certs exist, else HTTP
const sslKey = "../key.pem";
const sslCert = "../cert.pem";
let server;
if (fs.existsSync(sslKey) && fs.existsSync(sslCert)) {
  const https = require("https");
  const options = {
    key: fs.readFileSync(sslKey),
    cert: fs.readFileSync(sslCert),
  };
  server = https.createServer(options, app);
} else {
  server = http.createServer(app);
}

// --- Socket.io setup ---
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});
const socketHandlers = require("./src/socket/socketHandlers");
socketHandlers(io);

// Set Socket.io instance for likeService
const likeService = require("./src/services/likeService");
likeService.setSocketIO(io);

// Set Socket.io instance for activityService
const activityService = require("./src/services/activityService");
activityService.setSocketIO(io);

// Set Socket.io instance for profileService
const profileService = require("./src/services/profileService");
profileService.setSocketIO(io);

// Set Socket.io instance for commentService
const commentService = require("./src/services/commentService");
commentService.setSocketIO(io);

// Set Socket.io instance for deviceManagementService
const deviceManagementService = require("./src/services/deviceManagementService");
deviceManagementService.setSocketIO(io);

// Log Socket.io setup
console.log("Socket.io instance set for all services");
// --- End Socket.io setup ---

// Initialize MongoDB connection and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 MongoDB connected successfully`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
