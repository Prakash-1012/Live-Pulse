const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

dotenv.config();

const connectDB = require("./config/db");
const socketHandler = require("./socket/socketHandler");

connectDB();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// app.get("/", (req, res) => {
//   res.json({ message: "LivePulse API running" });
// });

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/session", require("./routes/sessionRoutes"));
app.use("/api/question", require("./routes/questionRoutes"));
app.use("/api/response", require("./routes/responseRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

const io = new Server(server,{
  cors:{origin:"*"}
});

socketHandler(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT,()=>{
  console.log(`Server running on ${PORT}`);
});