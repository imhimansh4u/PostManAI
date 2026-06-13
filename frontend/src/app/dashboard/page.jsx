"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listProjects } from "@/app/lib/projectApi.js";
import NewProjectForm from "@/components/dashboard/newprojectComponent.jsx"; // Import our new sub-component cleanly
import {
  BarChart2,
  CheckCircle,
  AlertTriangle,
  Folder,
  Plus,
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

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const stats = [
    {
      label: "Total Tests",
      value: 24,
      icon: <BarChart2 size={40} />,
      iconColor: "#3b82f6",
      borderColor: "#1d3557",
      valueColor: "#ffffff",
    },
    {
      label: "Passing Tests",
      value: 18,
      icon: <CheckCircle size={40} />,
      iconColor: "#22c55e",
      borderColor: "#14532d",
      valueColor: "#22c55e",
    },
    {
      label: "Failing Tests",
      value: 6,
      icon: <AlertTriangle size={40} />,
      iconColor: "#f59e0b",
      borderColor: "#451a03",
      valueColor: "#f59e0b",
    },
  ];

  const [projects, setprojects] = useState([]);
  const [isCreating, setIsCreating] = useState(false); // Flag state to view inline form box
  const [hoveredProjectId, sethoveredProjectId] = useState(null);

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
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left side Workspace Area: Context-switches cleanly based on isCreating state */}
        <div className="col-span-1 md:col-span-2 border border-zinc-800/80 bg-[#111118] p-6 rounded-xl transition-all duration-300">
          {/* Render regular title row only if we are NOT in inline creation mode */}
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
                  onClick={() => setIsCreating(true)} // Toggle form state view on click
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

          {/* Container - Houses Form component or standard Project list matching your exact UI container */}
          <div
            style={{ marginTop: "18px" }}
            className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar"
          >
            {isCreating ? (
              <NewProjectForm
                onClose={() => setIsCreating(false)}
                onSuccess={() => {
                  setIsCreating(false);
                  fetchProjects(); // Refresh listing immediately upon post submission success
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
                  // 1. Identify the project key explicitly
                  const currentId = project._id || project.id;
                  // 2. Check if this exact project is being hovered
                  const isThisHovered = hoveredProjectId === currentId;

                  return (
                    <div
                      // 3. Set and clear the specific ID in your handlers
                      onMouseEnter={() => sethoveredProjectId(currentId)}
                      onMouseLeave={() => sethoveredProjectId(null)}
                      key={currentId}
                      style={{
                        border: "1px solid #d97706",
                        borderRadius: "12px",
                        // 4. Conditional inline background evaluation
                        backgroundColor: isThisHovered ? "#1a1a24" : "#111118",
                        padding: "15px 20px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "between",
                        // 5. Smoothly transition color change
                        transition: "background-color 0.2s ease-in-out",
                      }}
                    >
                      <div>
                        <div
                          style={{ marginBottom: "2px" }}
                          className=" flex items-center gap-2"
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

        {/* Right Area remains completely untouched and perfectly visible */}
        <div className="col-span-1 border border-zinc-800/80 bg-[#111118] p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">
            Recent Activity
          </h3>
          <p style={{ color: "#ffffff" }} className="text-sm text-zinc-400">
            Activity section here
          </p>
        </div>
      </div>
    </div>
  );
}
