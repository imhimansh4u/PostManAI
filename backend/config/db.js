import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";

dotenv.config();

const dnsServers = process.env.DNS_SERVERS?.split(",").map((s) => s.trim()).filter(Boolean) || ["8.8.8.8", "1.1.1.1"];
dns.setServers(dnsServers);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(` MongoDB connected succesfully: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB error:", error);
    process.exit(1);
  }
};

export default connectDB;