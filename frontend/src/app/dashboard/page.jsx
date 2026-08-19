"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listProjects } from "@/app/lib/projectApi.js";
import { getRecentActivity, getStats } from "../lib/dashboardApi.js";
import NewProjectForm from "@/components/dashboard/newprojectComponent.jsx";
import {
  BarChart2,
  CheckCircle,
  AlertTriangle,
  Folder,
  Plus,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

const formatTimeAgo = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    if (isNaN(diffMs)) return "N/A";
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}hr ago`;
    return `${diffDays}d ago`;
  } catch (e) {
    return "N/A";
  }
};

// Helper function to extract path/pathname from full URL cleanly
const getRoutePath = (fullUrl) => {
  if (!fullUrl) return "";
  try {
    const urlObj = new URL(fullUrl);
    return urlObj.pathname;
  } catch (e) {
    return fullUrl; // Fallback to raw string if it's already a relative path
  }
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [projects, setprojects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [hoveredProjectId, sethoveredProjectId] = useState(null);

  // Dynamic stats state fetched from backend
  const [statsData, setStatsData] = useState({
    totalTestCases: 0,
    totalPassing: 0,
    totalFailing: 0,
  });

  const fetchDashboardStats = async () => {
    try {
      const response = await getStats();
      if (response?.data?.global) {
        setStatsData({
          totalTestCases: response.data.global.totalTestCases ?? 0,
          totalPassing: response.data.global.totalPassing ?? 0,
          totalFailing: response.data.global.totalFailing ?? 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      setActivityLoading(true);
      const response = await getRecentActivity(null, 10);
      if (response && Array.isArray(response.data)) {
        setActivities(response.data);
      } else if (Array.isArray(response)) {
        setActivities(response);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error("Failed to fetch recent activities:", error);
      setActivities([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const responseData = await listProjects();
      if (responseData && Array.isArray(responseData.data)) {
        setprojects(responseData.data);
      } else if (Array.isArray(responseData)) {
        setprojects(responseData);
      } else {
        setprojects([]);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setprojects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchDashboardStats();
    fetchActivities();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Dynamically constructed stats array using fetched API values
  const stats = [
    {
      label: "Total Tests",
      value: statsData.totalTestCases,
      icon: <BarChart2 size={40} />,
      iconColor: "#3b82f6",
      borderColor: "#1d3557",
      valueColor: "#ffffff",
    },
    {
      label: "Passing Tests",
      value: statsData.totalPassing,
      icon: <CheckCircle size={40} />,
      iconColor: "#22c55e",
      borderColor: "#14532d",
      valueColor: "#22c55e",
    },
    {
      label: "Failing Tests",
      value: statsData.totalFailing,
      icon: <AlertTriangle size={40} />,
      iconColor: "#f59e0b",
      borderColor: "#451a03",
      valueColor: "#f59e0b",
    },
  ];

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0a0a0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#71717a",
          fontFamily: "monospace",
        }}
      >
        Loading...
      </div>
    );

  if (!user) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0f",
        color: "#e4e4e7",
        fontFamily: "'Inter', sans-serif",
        padding: "20px 40px",
      }}
    >
      {/* ── ROW 1: Welcome Message ── */}
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#ffffff",
            margin: "0 0 6px 0",
          }}
        >
          Welcome back, {user.name} 👋
        </h1>
        <p style={{ color: "#71717a", fontSize: "14px", margin: 0 }}>
          Here's your testing overview,
        </p>
      </div>

      {/* ── ROW 2: Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            style={{
              backgroundColor: "#111118",
              border: `1px solid ${stat.borderColor}`,
              borderRadius: "12px",
            }}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span
                  style={{
                    marginLeft: "4px",
                    fontSize: "13px",
                    color: "#71717a",
                    fontWeight: "500",
                  }}
                >
                  {stat.label}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div
                  style={{
                    marginLeft: "4px",
                    fontSize: "36px",
                    fontWeight: "700",
                    color: stat.valueColor,
                    lineHeight: "1",
                  }}
                >
                  {stat.value}
                </div>

                <div
                  style={{
                    color: stat.iconColor,
                    padding: "4px",
                    marginRight: "2px",
                  }}
                >
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── SEPARATOR SPACE ── */}
      <div className="h-5 w-full"></div>

      {/* ── ROW 3: Projects + Activity ── */}
      <div style={{marginTop : "50px"}} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left side Workspace Area */}
        <div className="col-span-1 md:col-span-2 border border-zinc-800/80 bg-[#111118] p-6 rounded-xl transition-all duration-300">
          {!isCreating && (
            <div className="flex items-center justify-between w-full mb-6">
              <span
                style={{ marginLeft: "10px", marginTop: "5px" }}
                className="text-xl font-bold text-white tracking-tight"
              >
                My Projects
              </span>
              <span>
                <Button
                  onClick={() => setIsCreating(true)}
                  className="hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: "#fbbf24",
                    color: "#000000",
                    fontSize: "13px",
                    fontWeight: "700",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 10px",
                    marginRight: "10px",
                    marginTop: "5px",
                  }}
                >
                  <Plus size={15} />
                  New Project
                </Button>
              </span>
            </div>
          )}

          {/* Container - Houses Form component or standard Project list */}
          <div
            style={{ marginTop: "18px" }}
            className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar"
          >
            {isCreating ? (
              <NewProjectForm
                onClose={() => setIsCreating(false)}
                onSuccess={() => {
                  setIsCreating(false);
                  fetchProjects();
                  fetchDashboardStats();
                  fetchActivities();
                }}
              />
            ) : !Array.isArray(projects) || projects.length === 0 ? (
              <div className="text-zinc-500 text-sm py-8 text-center border border-dashed border-zinc-800 rounded-lg">
                No projects added yet. Click "New Project" to begin.
              </div>
            ) : (
              <div
                style={{ marginLeft: "5px" }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {projects.map((project) => {
                  const currentId = project._id || project.id;
                  const isThisHovered = hoveredProjectId === currentId;

                  return (
                    <div
                      onMouseEnter={() => sethoveredProjectId(currentId)}
                      onMouseLeave={() => sethoveredProjectId(null)}
                      key={currentId}
                      style={{
                        border: "1px solid #d97706",
                        borderRadius: "12px",
                        backgroundColor: isThisHovered ? "#1a1a24" : "#111118",
                        padding: "15px 20px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "between",
                        transition: "background-color 0.2s ease-in-out",
                      }}
                    >
                      <div>
                        <div
                          style={{ marginBottom: "2px" }}
                          className="flex items-center gap-2"
                        >
                          <Folder size={18} className="text-amber-500" />
                          <span className="text-lg font-semibold text-white truncate">
                            {project.name}
                          </span>
                        </div>

                        <div className="text-sm text-zinc-400 mb-1 flex items-center gap-1.5 flex-wrap">
                          <span>{project.stats?.totalTests || 0} tests</span>
                          <span className="text-zinc-600">•</span>
                          {project.stats?.failing > 0 ? (
                            <span className="text-red-500 font-medium">
                              {project.stats.failing} fail
                            </span>
                          ) : (
                            <span className="text-green-500 font-medium">
                              pass
                            </span>
                          )}
                        </div>

                        <div
                          style={{ marginBottom: "6px" }}
                          className="text-xs text-zinc-500 mb-6"
                        >
                          Last run: {formatTimeAgo(project.updatedAt)}
                        </div>
                      </div>

                      <button
                        onClick={() => router.push(`/projects/${currentId}`)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid #d97706",
                          backgroundColor: "transparent",
                          color: "#fbbf24",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "background-color 0.2s",
                        }}
                        className="hover:bg-amber-500/10"
                      >
                        Open Project
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Area: Live Recent Activity Feed with Route Paths */}
        <div className="col-span-1 border border-zinc-800/80 bg-[#111118] p-6 rounded-xl flex flex-col justify-between">
          <div>
            <div
              style={{ marginBottom: "16px" }}
              className="flex items-center justify-between border-b border-zinc-800/60 pb-3"
            >
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-amber-500" />
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  Recent Activity
                </h3>
              </div>
              <span className="text-xs text-zinc-500 font-medium">
                Last 10 runs
              </span>
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {activityLoading ? (
                <div className="text-zinc-500 text-xs text-center py-10 font-mono">
                  Loading activities...
                </div>
              ) : activities.length === 0 ? (
                <div className="text-zinc-500 text-xs py-10 text-center border border-dashed border-zinc-800/80 rounded-lg">
                  No recent runs recorded yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {activities.map((item) => {
                    const isPassed =
                      item.status?.toLowerCase() === "pass" ||
                      item.status?.toLowerCase() === "passed";
                    const routePath = getRoutePath(item.url);

                    return (
                      <div
                        key={item.runId}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                        }}
                        className="bg-[#181822] hover:bg-[#1f1f2e] border border-zinc-800/50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {isPassed ? (
                            <CheckCircle2
                              size={16}
                              className="text-emerald-500 shrink-0"
                            />
                          ) : (
                            <XCircle
                              size={16}
                              className="text-rose-500 shrink-0"
                            />
                          )}

                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-zinc-200 truncate">
                              {item.projectName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                              <span
                                className={`font-mono text-[10px] px-1 py-0.2 rounded shrink-0 ${
                                  isPassed
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-rose-500/10 text-rose-400"
                                }`}
                              >
                                {isPassed ? "PASS" : "FAIL"}
                              </span>
                              {item.method && (
                                <span className="font-mono text-[10px] text-amber-400/90 font-semibold shrink-0">
                                  {item.method}
                                </span>
                              )}
                              {routePath && (
                                <span
                                  title={item.url}
                                  className="font-mono text-[10px] text-zinc-400 truncate"
                                >
                                  {routePath}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{ marginLeft: "8px" }}
                          className="flex items-center gap-1 text-[11px] text-zinc-400 shrink-0"
                        >
                          <Clock size={12} className="text-zinc-400" />
                          <span>{formatTimeAgo(item.runAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
