// @/app/projects/[id]/_components/MainArea.jsx
"use client";

import KeyValueEditor from "./_components/KeyValueEditor";
import { useState, useEffect } from "react";
import MainAreaTestTab from "./_components/mainareaTestTab";
import ErrorExplainPanel from "./_components/SidebarErrorExplain.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useParams } from "next/navigation";
import {
  fetchProjectCookies,
  updateProjectCookies,
} from "@/app/lib/projectApi";

export default function MainArea({ activeTab }) {
  const [mode, setMode] = useState("ai"); // 'ai' or 'normal'
  const [cookies, setCookies] = useState([]);

  const params = useParams();
  const projectId = params?.id;

  useEffect(() => {
    // load cookies on mount / when projectId changes
    if (!projectId) return;
    let mounted = true;
    (async () => {
      try {
        const cookieObj = await fetchProjectCookies(projectId);
        if (!mounted) return;
        const pairs = Object.entries(cookieObj || {}).map(([k, v]) => ({
          key: k,
          value: v,
        }));
        setCookies(pairs);
      } catch (err) {
        console.error("Failed to fetch project cookies:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  // Shared structural tracking state hook to link both workspace columns
  const [currentTestRunResponse, setCurrentTestRunResponse] = useState(null);

  const handleSaveCookies = async (updatedPairsArray) => {
    if (!projectId) return;
    const cookiesObj = {};
    updatedPairsArray.forEach((p) => {
      if (p.key && p.key.trim() !== "") {
        cookiesObj[p.key.trim()] = p.value ?? "";
      }
    });
    try {
      const updated = await updateProjectCookies(projectId, cookiesObj);
      const pairs = Object.entries(updated || {}).map(([k, v]) => ({
        key: k,
        value: v,
      }));
      setCookies(pairs);
    } catch (err) {
      console.error("Failed to update cookies:", err);
    }
  };

  if (activeTab === "history") {
    return <div>Working on this</div>;
  }

  return (
    <main className="flex-1 h-full overflow-hidden flex flex-col bg-[#08080c] p-6 text-zinc-100 select-none">
      <div className="h-full rounded-2xl border border-zinc-800/80 bg-[#0c0c12] shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
        {/* HEADER BLOCK: CONTROLS RUNWAY */}
        <div className="flex items-center justify-between shrink-0 border-b border-zinc-800/50 bg-[#0e0e16]/30 px-6 py-4.5">
          <div className="flex flex-col gap-0.5">
            <p
              style={{ padding: "10px" }}
              className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500/90 antialiased"
            >
              Workspace Context
            </p>
            <h2
              style={{ paddingLeft: "7px" }}
              className="text-lg font-semibold tracking-wide text-white/90 transition-all duration-200"
            >
              {mode === "ai" ? "AI Prompt Interface" : "Normal Testing Suite"}
            </h2>
          </div>

          <div
            style={{ marginLeft: "auto" }}
            className="flex items-center shrink-0"
          >
            <div
              style={{ width: "1px", height: "16px" }}
              className="bg-gradient-to-b from-orange-400 via-amber-500 to-orange-600 opacity-80 shrink-0"
            />
            <div className="flex items-center">
              <Popover>
                <PopoverTrigger
                  style={{ padding: "6px 14px" }}
                  className="bg-transparent border-0 text-xs font-mono font-bold tracking-wider text-sky-400 hover:text-sky-300 uppercase cursor-pointer transition-colors outline-none rounded-none hover:bg-white/[0.02]"
                >
                  <span>Cookies</span>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  sideOffset={6}
                  align="end"
                  className="w-[380px] bg-[#0c0c12] border border-zinc-800 rounded-none shadow-2xl p-4 mt-1"
                >
                  <KeyValueEditor
                    pairs={cookies}
                    onChange={setCookies}
                    label="Cookie Jar Storage"
                    onSave={handleSaveCookies}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex bg-[#050508] border border-zinc-800 p-1 rounded-xl w-64 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
            <button
              type="button"
              onClick={() => setMode("ai")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer group active:scale-[0.97] ${mode === "ai" ? "text-white bg-gradient-to-b from-zinc-800/90 to-zinc-900 border border-zinc-700/50 shadow-[0_2px_4px_rgba(0,0,0,0.5)] font-semibold" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20"}`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${mode === "ai" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" : "bg-transparent opacity-0"}`}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`transition-colors duration-200 ${mode === "ai" ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.2)]" : "text-zinc-500 group-hover:text-zinc-400"}`}
              >
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
                <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z" />
              </svg>
              <span>AI Mode</span>
            </button>
            <button
              style={{ padding: "10px" }}
              type="button"
              onClick={() => setMode("normal")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer group active:scale-[0.97] ${mode === "normal" ? "text-white bg-gradient-to-b from-zinc-800/90 to-zinc-900 border border-zinc-700/50 shadow-[0_2px_4px_rgba(0,0,0,0.5)] font-semibold" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`transition-colors duration-200 ${mode === "normal" ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.2)]" : "text-zinc-500 group-hover:text-zinc-400"}`}
              >
                <line x1="21" x2="14" y1="4" y2="4" />
                <line x1="10" x2="3" y1="4" y2="4" />
                <line x1="21" x2="12" y1="12" y2="12" />
                <line x1="8" x2="3" y1="12" y2="12" />
                <line x1="14" x2="14" y1="2" y2="6" />
                <line x1="8" x2="8" y1="10" y2="14" />
              </svg>
              <span>Normal Mode</span>
            </button>
          </div>
        </div>

        {/* ─── SPLIT VIEWPORT CONTAINER MESH GRID ─── */}
        <div className="grid grid-cols-3 h-full overflow-hidden">
          {/* Left Column Area (Takes up 2/3 of space) */}
          <div className="col-span-2 border-r border-zinc-800/80 overflow-y-auto">
            <MainAreaTestTab
              mode={mode}
              onModeChange={setMode}
              onTestExecuted={setCurrentTestRunResponse} // 👈 Capture result hook link here
            />
          </div>

          {/* Right Column Area (Takes up 1/3 of space - replaces your old constant placeholder) */}
          <div className="col-span-1 h-full overflow-hidden">
            <ErrorExplainPanel
              apiResponse={currentTestRunResponse} // 👈 Feed data down directly to the panel
            />
          </div>
        </div>
      </div>
    </main>
  );
}
