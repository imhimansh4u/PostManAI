import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import userRoutes from "./routes/user.route.js";
import projectRoutes from "./routes/project.route.js";
import githubRoutes from "./routes/github.route.js";
import testRoutes from "./routes/test.route.js";
import chatRoutes from "./routes/chatRoute.js";
import suiteRoutes from "./routes/testSuiteRoutes.js"

dotenv.config(); // ← must be before everything else

const app = express(); // initialise the app

app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // specifies which frontend is allowed to access the backend , specified in the .env
    credentials: true, //This means: "Allow cookies, sessions, or authentication headers to be sent in requests."
  }),
);
// common middlewares
app.use(express.json({ limit: "16kb" })); //“When the frontend sends data in JSON format (like with POST/PUT), read and parse that JSON — but don’t accept more than 16 kilobytes of data.”
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //It parses data sent with the application/x-www-form-urlencoded content type (the default for HTML forms) and adds it to req.body so you can access it in your route handlers.
app.use(cookieParser()); // Helps to read the cookies from the websites

// HealthCheck of the Server at /health
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "PostmanAI backend is running" });
});

app.use("/postmanai/v1/users", userRoutes);
app.use("/postmanai/v1/projects", projectRoutes);

// Now Github Routes
app.use("/postmanai/v1/github", githubRoutes);

// Now Test Routes
app.use("/postmanai/v1/test", testRoutes);


// Now Suite Routes
app.use("/postmanai/v1/suite",suiteRoutes); 
app.use((err, req, res, next) => {
  const statusCode = err?.statusCode || 500;
  const message = err?.message || "Something went wrong";

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    data: null,
    errors: err?.errors || [],
  });
});

// ChatMessage Routes
app.use("/postmanai/v1", chatRoutes);

export { app };
