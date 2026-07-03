"use client";

import { useState } from "react";

const dummyAiAnalysis = {
  shortExplanation:
    "The server rejected the request because the authentication handshake expired or the signature structure was mangled during transport. This commonly happens if your workspace cookies drop their active session keys.",
  suggestedFix:
    "1. Open your Cookie Jar popover at the top right.\n2. Ensure your session identifier parameters are populated.\n3. Click 'Sync Jar' to refresh the token context before hitting Send again.",
  generatedAt: new Date().toISOString(),
};

export default function ErrorExplainPanel({ apiResponse }) {
  const [showExplanation, setShowExplanation] = useState(false);

  // Check if a test has been executed yet
  const hasTestRun = !!apiResponse;

  // Detect if the test run encountered structural faults
  const isFailed = apiResponse?.status === "fail" || apiResponse?.status >= 400;

  // Read response properties dynamically or fall back to dummy mock testing state
  const runtimeAnalysis =
    apiResponse?.aiAnalysis || (hasTestRun ? dummyAiAnalysis : null);

  return (
    <div className="h-full flex flex-col bg-[#0b0c10] text-zinc-100 font-mono select-none">
      {/* 1. PANEL HEADER TRACK */}
      <div
        style={{ padding: "16px" }}
        className="border-b border-zinc-800/80 bg-black/10 shrink-0"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Error Explanation
          </h3>
          {hasTestRun && (
            <span
              className={`text-[9px] font-bold px-2 py-0.5 border uppercase ${
                isFailed
                  ? "text-rose-400 bg-rose-500/5 border-rose-500/20"
                  : "text-emerald-400 bg-emerald-500/5 border-emerald-500/20"
              }`}
            >
              {isFailed ? "Fault Detected" : "Passed"}
            </span>
          )}
        </div>
        <p className="text-[10px] text-zinc-600 mt-1">
          Use the current runTest analysis parameters
        </p>
      </div>

      {/* 2. MAIN BODY: SCROLLABLE WORKSPACE INFO OVERVIEW */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "16px" }}>
        {!hasTestRun ? (
          <div className="h-full flex items-center justify-center text-center px-4">
            <p className="text-xs text-zinc-600 leading-relaxed">
              Run the test suite script, then click{" "}
              <span className="text-zinc-400 font-bold">Explain Error</span> to
              map diagnostics.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Context Summary Meta Block */}
            <div className="bg-[#121318]/40 border border-zinc-800/60 p-3 flex flex-col gap-2">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                Request Details
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-amber-400 font-bold">
                  {apiResponse?.method || "GET"}
                </span>
                <span className="text-zinc-400 truncate max-w-[140px]">
                  {apiResponse?.url || "/api/endpoint"}
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                Returned Status:{" "}
                <span
                  className={isFailed ? "text-rose-400" : "text-emerald-400"}
                >
                  {apiResponse?.status || 200}
                </span>
              </div>
            </div>

            {/* AI Diagnostics Canvas Reveal State */}
            {showExplanation && runtimeAnalysis ? (
              <div className="flex flex-col gap-4 animate-fadeIn">
                {/* Short Breakdown */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    AI Summary Analysis
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed bg-[#16171d] p-3 border border-zinc-800/80">
                    {runtimeAnalysis.shortExplanation}
                  </p>
                </div>

                {/* Suggested Fix Action Steps */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    Suggested Solution
                  </span>
                  <p className="text-xs text-emerald-400/90 leading-relaxed bg-emerald-950/10 p-3 border border-emerald-900/20 whitespace-pre-line">
                    {runtimeAnalysis.suggestedFix}
                  </p>
                </div>

                {/* Timestamp Meta Mark */}
                <div className="text-[9px] text-zinc-600 text-right italic">
                  Analyzed at:{" "}
                  {new Date(runtimeAnalysis.generatedAt).toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-zinc-800/80 p-4 text-center">
                <p className="text-[11px] text-zinc-600">
                  Diagnostics loaded. Click the primary button below to evaluate
                  stack logs.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. FIXED BOTTOM ACTION BLOCK CONTROL */}
      <div
        style={{ padding: "12px 16px" }}
        className="border-t border-zinc-800/60 bg-black/5 shrink-0 flex flex-col gap-2"
      >
        <button
          type="button"
          disabled={!hasTestRun}
          onClick={() => setShowExplanation(true)}
          style={{ padding: "10px" }}
          className={`w-full text-xs font-bold tracking-wider uppercase cursor-pointer outline-none transition-all duration-150 rounded-none border-0 text-center ${
            !hasTestRun
              ? "bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-40"
              : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:scale-[0.98]"
          }`}
        >
          Explain Error
        </button>
        <span className="text-[9px] text-zinc-600 text-center tracking-wide">
          Uses response metrics from the active console pipeline
        </span>
      </div>
    </div>
  );
}
