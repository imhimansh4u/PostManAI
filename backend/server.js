import { app } from "./app.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";


dotenv.config();

const PORT = process.env.PORT || 1101;
// Connect to MongoDB first, then start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(" MongoDB connection failed:", error);
    process.exit(1);
  });