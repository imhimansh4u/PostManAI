"use client";

import { useState, useEffect } from "react";
import { fetchProjectDetail } from "@/app/lib/projectApi.js";
import { connectGithub, getRepos, selectRepo } from "@/app/lib/githubApi.js";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Settings,
  ExternalLink,
  GitBranch,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ── Shadcn UI Dropdown Primitives ──
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Sidebar() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // ── Project State ──
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Repo State ──
  const [repos, setAllRepos] = useState([]);
  const [repoSelected, setRepoSelected] = useState("");
  const [reposLoading, setReposLoading] = useState(false);

  // ── Fetch Project ──
  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const data = await fetchProjectDetail(id);
        setProject(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      loadProject();
    }
  }, [id, searchParams]);

  // ── Fetch Repos when GitHub connected but no repo selected ──
  useEffect(() => {
    const loadRepos = async () => {
      if (user?.github?.connected && !project?.github?.repoFullName) {
        try {
          setReposLoading(true);
          const data = await getRepos();
          setAllRepos(data.data);
        } catch (err) {
          console.error("Failed to fetch repos:", err);
        } finally {
          setReposLoading(false);
        }
      }
    };
    loadRepos();
  }, [user?.github?.connected, project?.github?.repoFullName]);

  // ── Handle Repo Selection ──
  const handleSelectedRepo = async () => {
    if (!repoSelected) return;
    const repo = repos.find((r) => r.fullName === repoSelected);
    try {
      await selectRepo({
        projectId: id,
        repoFullName: repoSelected,
        branch: repo?.defaultBranch || "main",
      });
      // Refresh project data after saving
      const data = await fetchProjectDetail(id);
      setProject(data.data);
    } catch (err) {
      console.error("Failed to select repo:", err);
    }
  };

  return (
    <aside className="w-[240px] h-screen bg-[#0c0c12] border-r border-zinc-800 flex flex-col text-zinc-400 select-none">
      <div
        style={{ padding: "20px" }}
        className="p-5 border-b border-zinc-800/60"
      >
        {/* ── LOADING STATE ── */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-5 bg-zinc-800 rounded-md w-4/5 mx-auto"></div>
            <div className="h-[2px] bg-zinc-800 rounded-full"></div>
            <div className="h-3 bg-zinc-800 rounded w-full"></div>
            <div className="h-3 bg-zinc-800 rounded w-3/4"></div>
          </div>
        ) : error ? (
          /* ── ERROR STATE ── */
          <div
            style={{ paddingTop: "16px", paddingBottom: "16px" }}
            className="py-4"
          >
            <div className="text-red-400 text-sm text-center font-medium">
              Failed to load project
            </div>
            <div
              style={{ marginTop: "16px" }}
              className="h-[2px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent rounded-full"
            ></div>
          </div>
        ) : (
          /* ── SUCCESS STATE ── */
          <div className="space-y-3">
            {/* Project Name */}
            <h2 className="text-lg font-semibold text-white text-center truncate tracking-wide">
              {project?.name}
            </h2>

            {/* Custom Orangish Amber Accent Divider */}
            <div className="relative">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full"></div>
              <div className="absolute inset-0 blur-sm bg-amber-500/20"></div>
            </div>

            {/* Base URL */}
            <div
              style={{ marginTop: "16px", padding: "10px" }}
              className="bg-zinc-900/60 border border-zinc-800 rounded-lg"
            >
              <p
                style={{ textAlign: "center", marginBottom: "6px" }}
                className="text-[11px] uppercase tracking-wider text-zinc-500"
              >
                Base URL
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <p className="text-xs font-mono text-zinc-400 break-all text-center hover:text-white transition-colors">
                  {project?.baseUrl}
                </p>
                <ExternalLink className="w-3 h-3 text-zinc-600 shrink-0" />
              </div>
            </div>

            {/* Structural Separator before GitHub Section */}
            <div
              style={{ marginTop: "24px", marginBottom: "16px" }}
              className="h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent"
            ></div>

            {/* ── GITHUB SECTION ── */}
            <div style={{ marginTop: "12px" }}>
              {/* Section Label */}
              <p
                style={{ textAlign: "center", marginBottom: "12px" }}
                className="text-[11px] uppercase tracking-wider text-zinc-500 px-1"
              >
                GitHub Integration
              </p>

              {/* STATE 1 — User hasn't linked GitHub account yet */}
              {!user?.github?.connected ? (
                <div className="flex justify-center items-center w-full px-2 py-1">
                  <button
                    style={{ paddingTop: "10px", paddingBottom: "10px" }}
                    onClick={() => connectGithub()}
                    className="group flex items-center justify-center gap-2.5 w-full px-4
                     rounded-xl border border-zinc-800/80 text-zinc-300 font-medium
                     bg-gradient-to-b from-zinc-900 via-[#0d0d12] to-[#08080c]
                     shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_1px_3px_rgba(0,0,0,0.5)]
                     transition-all duration-200 ease-out
                     hover:border-zinc-700 hover:text-zinc-100 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.6)]
                     active:scale-[0.97]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4 text-zinc-400 group-hover:text-amber-500 transition-colors duration-200 fill-current shrink-0"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span className="text-xs font-semibold tracking-wide">
                      Connect GitHub
                    </span>
                  </button>
                </div>
              ) : (
                /* STATE 2 — GitHub account is linked */
                <div className="space-y-3 text-zinc-300 antialiased">
                  {/* Status Block Header Row */}
                  <div className="flex items-center gap-2">
                    {/* Badge Pill */}
                    <div
                      style={{ padding: "8px 12px" }}
                      className="flex items-center gap-2 flex-1 min-w-0 bg-zinc-900/60 border border-zinc-800 rounded-lg"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-3.5 h-3.5 text-emerald-500 fill-current shrink-0"
                      >
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span className="text-xs font-mono text-zinc-300 truncate">
                        @{user?.github?.username}
                      </span>
                    </div>

                    {/* Integrated Settings Gear Button (Shadcn Dropdown) */}
                    <DropdownMenu>
                      {/* Removed asChild and replaced the inner <button> with an interactive inline-flex <span> */}
                      <DropdownMenuTrigger>
                        <span
                          style={{ padding: "8px" }}
                          className="flex items-center justify-center rounded-lg border border-zinc-800/80 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 active:scale-95 group cursor-pointer transition-all duration-200"
                        >
                          <Settings className="w-4 h-4 transition-transform duration-300 ease-out group-hover:rotate-45" />
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-44 bg-[#0d0d12] border-zinc-800 text-zinc-300 shadow-xl rounded-lg"
                        side="right"
                        align="start"
                        sideOffset={6}
                      >
                        <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-2.5 py-1.5">
                          Settings
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem
                          onClick={() =>
                            console.log("go to github settings tab")
                          }
                          className="text-xs px-2.5 py-2 cursor-pointer focus:bg-zinc-900 focus:text-zinc-100 transition-colors"
                        >
                          Configuration Hub
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs px-2.5 py-2 cursor-pointer focus:bg-zinc-900 focus:text-zinc-100 transition-colors">
                          Webhook Actions
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* STATE 2A — No repo selected yet */}
                  {!project?.github?.repoFullName ? (
                    <div style={{ marginTop: "12px" }} className="space-y-2.5">
                      {reposLoading ? (
                        <div
                          style={{ padding: "12px" }}
                          className="flex items-center justify-center"
                        >
                          <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                        </div>
                      ) : (
                        <>
                          {/* Repo Dropdown Wrapper */}
                          <div className="relative">
                            <select
                              value={repoSelected}
                              onChange={(e) => setRepoSelected(e.target.value)}
                              style={{
                                paddingLeft: "14px",
                                paddingRight: "32px",
                                paddingTop: "10px",
                                paddingBottom: "10px",
                              }}
                              className="w-full bg-[#0d0d12] border border-zinc-800/80 rounded-xl
                               text-xs text-zinc-300 font-medium appearance-none outline-none cursor-pointer
                               focus:border-zinc-700 transition-all"
                            >
                              <option value="">Select a repository</option>
                              {repos.map((repo) => (
                                <option key={repo.id} value={repo.fullName}>
                                  {repo.name} {repo.private ? "🔒" : "🌐"}
                                </option>
                              ))}
                            </select>
                            {/* Dropdown Indicator */}
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                              <svg
                                className="w-3.5 h-3.5 fill-current"
                                viewBox="0 0 20 20"
                              >
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </div>
                          </div>

                          {/* Save Button */}
                          <button
                            onClick={handleSelectedRepo}
                            disabled={!repoSelected}
                            style={{ paddingTop: "8px", paddingBottom: "8px" }}
                            className="w-full text-xs font-semibold rounded-xl
                             border border-zinc-800 text-zinc-300
                             bg-gradient-to-b from-zinc-900 via-[#0d0d12] to-[#08080c]
                             disabled:opacity-40 disabled:pointer-events-none
                             hover:border-zinc-700 hover:text-zinc-100
                             active:scale-[0.97] transition-all duration-200"
                          >
                            Save Repository
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    /* STATE 2B — Repo already selected */
                    <div style={{ marginTop: "12px" }}>
                      <div
                        style={{ padding: "8px 12px" }}
                        className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-lg"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="text-xs font-mono text-zinc-300 truncate">
                          {project?.github?.repoFullName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
