"use client";

import { useState, useEffect, useRef } from "react";
import { fetchProjectDetail } from "@/app/lib/projectApi.js";
import {
  connectGithub,
  getRepos,
  getRepoBranches,
  syncRepo,
  disconnectGithub,
  selectRepo,
  deleteIndexedFiles,
} from "@/app/lib/githubApi.js";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import GithubSettingsPopup from "./_components/GithubSettingsPopup";
import {
  Settings,
  ExternalLink,
  GitBranch,
  Loader2,
  Terminal,
  History,
} from "lucide-react";
import { toast } from "sonner";

export default function Sidebar({ activeTab, onTabChange }) {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Ref to track the exact location of the Settings Gear button
  const settingsBtnRef = useRef(null);
  const [triggerCoords, setTriggerCoords] = useState(null);

  // ── Project State ──
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Repo State ──
  const [repos, setAllRepos] = useState([]);
  const [repoSelected, setRepoSelected] = useState("");
  const [branchSelected, setBranchSelected] = useState("");
  const [branches, setBranches] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [savingRepo, setSavingRepo] = useState(false);
  const [githubPanelOpen, setGithubPanelOpen] = useState(false);
  const [syncingRepo, setSyncingRepo] = useState(false);
  const [disconnectingGithub, setDisconnectingGithub] = useState(false);
  const [deletingIndexedFiles, setDeletingIndexedFiles] = useState(false);

  // Rate limiter tracker state
  const [isRateLimited, setIsRateLimited] = useState(false);

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
    if (id) loadProject();
  }, [id, searchParams]);

  // Fetch Repos when GitHub connected but no repo selected
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

  // ── Fetch Branches ──
  useEffect(() => {
    const loadBranches = async () => {
      if (!repoSelected) {
        setBranches([]);
        setBranchSelected("");
        return;
      }
      try {
        setBranchesLoading(true);
        const data = await getRepoBranches({ repoFullName: repoSelected });
        const branchList = data.data || [];
        setBranches(branchList);

        const repo = repos.find((item) => item.fullName === repoSelected);
        const preferredBranch =
          branchList.find((item) => item.name === repo?.defaultBranch)?.name ||
          branchList[0]?.name ||
          "";
        setBranchSelected(preferredBranch);
      } catch (err) {
        console.error("Failed to fetch branches:", err);
        setBranches([]);
        setBranchSelected("");
      } finally {
        setBranchesLoading(false);
      }
    };
    loadBranches();
  }, [repoSelected, repos]);

  // Toggle Panel with Coordinates
  const toggleGithubPanel = () => {
    if (!githubPanelOpen && settingsBtnRef.current) {
      const rect = settingsBtnRef.current.getBoundingClientRect();
      setTriggerCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      setGithubPanelOpen(true);
    } else {
      setGithubPanelOpen(false);
    }
  };

  const handleSelectedRepo = async () => {
    if (!repoSelected || !branchSelected || savingRepo) return;
    try {
      setSavingRepo(true);
      await selectRepo({
        projectId: id,
        repoFullName: repoSelected,
        branch: branchSelected,
      });
      const data = await fetchProjectDetail(id);
      setProject(data.data);
    } catch (err) {
      console.error("Failed to select repo:", err);
    } finally {
      setSavingRepo(false);
    }
  };

  const handleSyncRepo = async () => {
    if (!project?.github?.repoFullName || syncingRepo) return;
    try {
      setSyncingRepo(true);
      await syncRepo({ projectId: id });
      const data = await fetchProjectDetail(id);
      toast.message("Synced Successfully");
      setProject(data.data);
      setIsRateLimited(false); // Reset tracking on successful invocation
    } catch (err) {
      if (err.response?.status === 429) {
        toast.error("Too many Syncs, Maximum 5 syncs per day allowed.");
        setIsRateLimited(true);
      } else {
        console.error("Failed to sync GitHub repo:", err);
      }
    } finally {
      setSyncingRepo(false);
    }
  };

  const handleDisconnectGithub = async () => {
    if (disconnectingGithub) return;
    try {
      setDisconnectingGithub(true);
      await disconnectGithub();
      setGithubPanelOpen(false);
      window.location.reload();
    } catch (err) {
      console.error("Failed to disconnect GitHub:", err);
    } finally {
      setDisconnectingGithub(false);
    }
  };

  const handleDeleteIndexedFiles = async () => {
    if (!project?.github?.repoFullName || deletingIndexedFiles) return;

    const confirmed = window.confirm(
      "Delete all indexed files for this repository? This will clear the current indexed metadata.",
    );
    if (!confirmed) return;

    try {
      setDeletingIndexedFiles(true);
      await deleteIndexedFiles({ projectId: id });
      const data = await fetchProjectDetail(id);
      setProject(data.data);
      setGithubPanelOpen(false);
      toast.message("Indexed files deleted successfully");
    } catch (err) {
      console.error("Failed to delete indexed files:", err);
      toast.error(
        err?.response?.data?.message || "Failed to delete indexed files",
      );
    } finally {
      setDeletingIndexedFiles(false);
    }
  };

  return (
    <aside className="w-60 h-screen bg-[#0c0c12] border-r border-zinc-800 flex flex-col text-zinc-400 select-none relative">
      <div style={{ padding: "20px" }} className="border-b border-zinc-800/60">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-5 bg-zinc-800 rounded-md w-4/5 mx-auto"></div>
            <div className="h-0.5 bg-zinc-800 rounded-full"></div>
            <div className="h-3 bg-zinc-800 rounded w-full"></div>
          </div>
        ) : error ? (
          <div style={{ paddingTop: "16px", paddingBottom: "16px" }}>
            <div className="text-red-400 text-sm text-center font-medium">
              Failed to load project
            </div>
            <div
              style={{ marginTop: "16px" }}
              className="h-0.5 bg-gradient-to-r from-transparent via-red-500/60 to-transparent rounded-full"
            ></div>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white text-center truncate tracking-wide">
              {project?.name}
            </h2>

            <div className="relative">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full"></div>
              <div className="absolute inset-0 blur-sm bg-amber-500/20"></div>
            </div>

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

            <div
              style={{ marginTop: "24px", marginBottom: "16px" }}
              className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"
            ></div>

            <div style={{ marginTop: "12px" }}>
              <p
                style={{ textAlign: "center", marginBottom: "12px" }}
                className="text-[11px] uppercase tracking-wider text-zinc-500 px-1"
              >
                GitHub Integration
              </p>

              {!user?.github?.connected ? (
                <div className="flex justify-center items-center w-full px-2 py-1">
                  <button
                    style={{ paddingTop: "10px", paddingBottom: "10px" }}
                    onClick={() => connectGithub()}
                    className="group flex items-center justify-center gap-2.5 w-full px-4 rounded-xl border border-zinc-800/80 text-zinc-300 font-medium bg-gradient-to-b from-zinc-900 via-[#0d0d12] to-[#08080c] shadow-md active:scale-[0.97] transition-all"
                  >
                    <span className="text-xs font-semibold tracking-wide">
                      Connect GitHub
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-zinc-300 antialiased">
                  <div className="flex items-center gap-2">
                    <div
                      style={{ padding: "8px 12px" }}
                      className="flex items-center gap-2 flex-1 min-w-0 bg-zinc-900/60 border border-zinc-800 rounded-lg"
                    >
                      <span className="text-xs font-mono text-zinc-300 truncate">
                        @{user?.github?.username}
                      </span>
                    </div>

                    <button
                      ref={settingsBtnRef}
                      type="button"
                      onClick={toggleGithubPanel}
                      style={{ padding: "8px" }}
                      className="flex items-center justify-center rounded-lg border border-zinc-800/80 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 active:scale-95 group cursor-pointer transition-all"
                    >
                      <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-200" />
                    </button>
                  </div>

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
                          <div className="relative">
                            <select
                              value={repoSelected}
                              onChange={(e) => setRepoSelected(e.target.value)}
                              style={{ padding: "10px 32px 10px 14px" }}
                              className="w-full bg-[#0d0d12] border border-zinc-800/80 rounded-xl text-xs text-zinc-300 font-medium appearance-none outline-none focus:border-zinc-700 transition-all cursor-pointer"
                            >
                              <option value="">Select a repository</option>
                              {repos.map((repo) => (
                                <option key={repo.id} value={repo.fullName}>
                                  {repo.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="relative">
                            <select
                              value={branchSelected}
                              onChange={(e) =>
                                setBranchSelected(e.target.value)
                              }
                              disabled={!repoSelected || branchesLoading}
                              style={{ padding: "10px 32px 10px 14px" }}
                              className="w-full bg-[#0d0d12] border border-zinc-800/80 rounded-xl text-xs text-zinc-300 font-medium appearance-none outline-none focus:border-zinc-700 transition-all disabled:opacity-50"
                            >
                              <option value="">
                                {branchesLoading
                                  ? "Loading branches..."
                                  : "Select a branch"}
                              </option>
                              {branches.map((b) => (
                                <option key={b.name} value={b.name}>
                                  {b.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            onClick={handleSelectedRepo}
                            disabled={
                              !repoSelected || !branchSelected || savingRepo
                            }
                            style={{
                              paddingTop: "8px",
                              paddingBottom: "8px",
                            }}
                            className="w-full text-xs font-semibold rounded-xl border border-zinc-800 text-zinc-300 bg-gradient-to-b from-zinc-900 to-[#08080c] disabled:opacity-40 transition-all"
                          >
                            {savingRepo ? "Saving..." : "Save Repository"}
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
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

      <GithubSettingsPopup
        open={githubPanelOpen}
        triggerCoords={triggerCoords}
        project={project}
        user={user}
        onClose={() => setGithubPanelOpen(false)}
        onSync={handleSyncRepo}
        onDisconnect={handleDisconnectGithub}
        onDeleteIndexedFiles={handleDeleteIndexedFiles}
        syncing={syncingRepo}
        disconnecting={disconnectingGithub}
        deletingIndexedFiles={deletingIndexedFiles}
        isRateLimited={isRateLimited}
      />

      <div className="mt-auto border-t border-zinc-800/80 bg-[#09090f]/40 px-4 py-3.5 backdrop-blur-sm">
        {/* Optional: Section Label for context */}
        <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-600 mb-2.5 px-1">
          Workspace
        </p>

        <div className="flex items-center gap-2 bg-[#08080c] border border-zinc-800/40 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onTabChange("test")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium tracking-wide relative overflow-hidden transition-all duration-200 group active:scale-[0.98] ${
              activeTab === "test"
                ? "text-white bg-gradient-to-b from-zinc-800/80 to-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.4)] border border-zinc-700/50"
                : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
            }`}
          >
            <Terminal
              className={`h-3.5 w-3.5 transition-colors duration-200 ${
                activeTab === "test"
                  ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                  : "text-zinc-500 group-hover:text-zinc-400"
              }`}
            />
            <span>Test</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("history")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium tracking-wide relative overflow-hidden transition-all duration-200 group active:scale-[0.98] ${
              activeTab === "history"
                ? "text-white bg-gradient-to-b from-zinc-800/80 to-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.4)] border border-zinc-700/50"
                : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
            }`}
          >
            <History
              className={`h-3.5 w-3.5 transition-colors duration-200 ${
                activeTab === "history"
                  ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                  : "text-zinc-500 group-hover:text-zinc-400"
              }`}
            />
            <span>History</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
