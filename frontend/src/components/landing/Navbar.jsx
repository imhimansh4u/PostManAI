"use client";

import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import UserMenu from "./UserMenu.jsx";

const Navbar = () => {
  const { user, loading } = useAuth();

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between", // Pushes left zone and right zone to opposite edges
        height: "56px",
        padding: "0 24px",
        backgroundColor: "#0a0a0f",
        borderBottom: "1px solid #1f1f2e",
        userSelect: "none",
      }}
    >
      {/* ── LEFT ZONE: ONLY LOGO & BRAND NAME ── */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          textDecoration: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #ff6b00 0%, #ff9e00 100%)",
            boxShadow: "0 2px 8px rgba(255, 107, 0, 0.2)",
          }}
        >
          <Rocket style={{ color: "#ffffff" }} size={16} strokeWidth={2.5} />
        </div>

        <span
          style={{
            fontSize: "15px",
            fontWeight: "700",
            fontFamily: "sans-serif",
            letterSpacing: "-0.02em",
            background: "linear-gradient(90deg, #ffffff 0%, #b3b3b3 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Postman
          <span
            style={{
              background: "linear-gradient(90deg, #ff9e00 0%, #ff6b00 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AI
          </span>
        </span>
      </Link>

      {/* ── RIGHT ZONE: ALL OTHER NAVIGATION ITEMS & ACTIONS ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* 1. Docs Button */}
        <Link href="/docs">
          <button
            onClick={() => {}}
            style={{
              height: "32px",
              padding: "0 12px",
              borderRadius: "6px",
              backgroundColor: "transparent",
              border: "none",
              color: "#8a8a93",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
            className="hover:text-zinc-200"
          >
            Docs
          </button>
        </Link>

        {/* 2. Get Started Button */}
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <button
            style={{
              height: "32px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0 14px",
              borderRadius: "8px",
              border: "1px solid #2e2e3f",
              color: "#e4e4e7",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              background: "linear-gradient(180deg, #1f1f2e 0%, #14141f 100%)",
              boxShadow:
                "inset 0 1px 0px rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.4)",
              transition: "all 0.2s ease",
            }}
            className="hover:border-zinc-600 hover:text-white active:scale-[0.98]"
          >
            <span>Get Started</span>

            {/* Custom SVG Icon */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                width: "14px",
                height: "14px",
                stroke: "currentColor",
                color: "#a1a1aa",
              }}
            >
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M14.5 16.5H16.1152C16.9825 16.5 17.7946 16.0745 18.2883 15.3614L21.6315 10.5323C21.8588 10.204 21.889 9.77803 21.7105 9.42094C21.3678 8.73545 20.4444 8.60613 19.9265 9.17109L17.2727 12.0661C16.2059 13.23 14.5301 13.612 13.0643 13.0257L9.44043 11.5762C8.53873 11.2155 7.51727 11.3218 6.70922 11.8605L2.87237 14.4184C2.37401 14.7507 2.20104 15.402 2.4689 15.9377C2.76223 16.5244 3.47562 16.7622 4.06229 16.4689L7.24772 14.8762C7.86821 14.5659 8.54577 15.1811 8.29674 15.8286L6.50003 20.5M7.00003 4H4.00003M6.00003 7H4.00003M18 6.5C18 8.70914 16.2092 10.5 14 10.5C11.7909 10.5 10 8.70914 10 6.5C10 4.29086 11.7909 2.5 14 2.5C16.2092 2.5 18 4.29086 18 6.5Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                />
              </g>
            </svg>
          </button>
        </Link>

        {/* 3. Authentication Status Action */}
        {loading ? (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#1f1f2e",
            }}
            className="animate-pulse"
          />
        ) : user ? (
          <UserMenu user={user} />
        ) : (
          <Link href="/auth/login" style={{ textDecoration: "none" }}>
            <Button
              style={{
                height: "32px",
                padding: "0 14px",
                fontSize: "13px",
                fontWeight: "600",
                borderRadius: "6px",
                color: "#0a0a0f",
                backgroundColor: "#ffffff",
                border: "none",
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
              className="hover:bg-zinc-200 active:scale-[0.98]"
            >
              Login
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
