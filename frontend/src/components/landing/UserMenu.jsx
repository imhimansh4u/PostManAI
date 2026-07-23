"use client";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  BookOpen,
  Settings,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { connectGithub, disconnectGithub } from "@/app/lib/githubApi"; // ← ADD THIS

const GithubIcon = ({ size = 14 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: `${size}px`, height: `${size}px`, shrink: 0 }}
  >
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.742 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const UserMenu = ({ user }) => {
  const { logout, setUser } = useAuth(); // ← ADD setUser

  // ── FIXED: reading from correct user.github object ──
  const isGithubConnected = !!user?.github?.connected;
  const githubUsername = user?.github?.username || "";
  const githubAvatar = user?.github?.profileUrl || "";

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  // ── NEW: handle connect ──
  const handleConnectGithub = () => {
    connectGithub();
  };

  // ── NEW: handle disconnect ──
  const handleDisconnectGithub = async () => {
    try {
      await disconnectGithub();
      // Update user in context so UI reflects immediately
      setUser((prev) => ({
        ...prev,
        github: {
          connected: false,
          username: null,
          profileUrl: null,
          connectedAt: null,
        },
      }));
    } catch (err) {
      console.error("Failed to disconnect GitHub:", err.message);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        style={{
          border: "none",
          backgroundColor: "transparent",
          outline: "none",
        }}
        className="group focus:outline-none"
      >
        <div
          style={{
            padding: "2px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1f1f2e 0%, #111118 100%)",
            border: "1px solid #2e2e3f",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          className="group-hover:border-zinc-600 group-hover:scale-[1.02]"
        >
          <Avatar className="h-7 w-7">
            {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
            <AvatarFallback className="bg-gradient-to-b from-zinc-800 to-zinc-950 text-zinc-300 text-[11px] font-bold tracking-tight border border-zinc-800/40">
              {getInitials(user.name || "User")}
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        style={{
          width: "260px",
          backgroundColor: "#0d0d12",
          border: "1px solid #1f1f2e",
          borderRadius: "12px",
          color: "#e4e4e7",
          padding: "6px",
          boxShadow:
            "0 10px 30px -10px rgba(0,0,0,0.7), inset 0 1px 0px rgba(255,255,255,0.03)",
        }}
      >
        {/* ── ROW 1: USER INFO ── */}
        <DropdownMenuGroup>
          <DropdownMenuLabel
            style={{ padding: "10px 12px 12px 12px", outline: "none" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* ── SHOW GITHUB AVATAR IF CONNECTED, ELSE NORMAL AVATAR ── */}
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={isGithubConnected ? githubAvatar : user?.avatar}
                  alt={user?.name}
                />
                <AvatarFallback className="bg-zinc-800 text-zinc-300 text-[11px] font-bold">
                  {getInitials(user?.name || "User")}
                </AvatarFallback>
              </Avatar>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "2px" }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ffffff",
                    lineHeight: "1.2",
                  }}
                >
                  {user.name || "Developer Workspace"}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "400",
                    color: "#71717a",
                  }}
                >
                  {user.email || "developer@postmanai.com"}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator
          style={{ backgroundColor: "#1f1f2e", margin: "4px 6px" }}
        />

        {/* ── ROW 2: OPTIONS ── */}
        <DropdownMenuGroup style={{ padding: "4px 0" }}>
          <DropdownMenuItem
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              outline: "none",
              backgroundColor: "transparent",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-zinc-900 group"
            onClick={() => console.log("Edit workspace parameters clicked")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Settings
                size={14}
                className="text-zinc-500 group-hover:text-zinc-300"
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#d4d4d8",
                }}
                className="group-hover:text-white"
              >
                Edit Settings
              </span>
            </div>
            <span
              style={{ fontSize: "10px", color: "#52525b" }}
              className="font-mono"
            >
              ⌘E
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              outline: "none",
              backgroundColor: "transparent",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-zinc-900 group"
          >
            <BookOpen
              size={14}
              className="text-zinc-500 group-hover:text-zinc-300"
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: "500",
                color: "#d4d4d8",
              }}
              className="group-hover:text-white"
            >
              Documentation
            </span>
          </DropdownMenuItem>

          {/* ── GITHUB ITEM — fully wired up ── */}
          <DropdownMenuItem
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              outline: "none",
              backgroundColor: "transparent",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-zinc-900 group"
            onClick={
              isGithubConnected ? handleDisconnectGithub : handleConnectGithub
            }
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                maxWidth: "80%",
              }}
            >
              <div
                className={
                  isGithubConnected
                    ? "text-emerald-500"
                    : "text-zinc-500 group-hover:text-zinc-300"
                }
              >
                <GithubIcon size={14} />
              </div>

              {isGithubConnected ? (
                // ── CONNECTED: show username + disconnect hint ──
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#d4d4d8",
                    }}
                    className="truncate group-hover:text-white"
                  >
                    @{githubUsername}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#10b981",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <ShieldCheck size={10} /> Connected · Click to disconnect
                  </span>
                </div>
              ) : (
                // ── NOT CONNECTED: show connect option ──
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#d4d4d8",
                  }}
                  className="group-hover:text-white"
                >
                  Connect GitHub
                </span>
              )}
            </div>

            {!isGithubConnected && (
              <ExternalLink
                size={11}
                className="text-zinc-600 group-hover:text-zinc-400"
              />
            )}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator
          style={{ backgroundColor: "#1f1f2e", margin: "4px 6px" }}
        />

        {/* ── ROW 3: LOGOUT ── */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              outline: "none",
              backgroundColor: "transparent",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-rose-500/10 group"
            onClick={handleLogout}
          >
            <LogOut
              size={14}
              className="text-rose-500/70 group-hover:text-rose-400"
            />
            <span
              style={{ fontSize: "12px", fontWeight: "600", color: "#f43f5e" }}
            >
              Log Out
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
