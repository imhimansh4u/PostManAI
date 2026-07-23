"use client";

import React, { useState, useEffect } from "react";
import { fetchsuite, fetchtestRuns } from "@/app/lib/testSuiteApi";
import {
  Folder,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileJson,
  ArrowRight,
  Layers,
  X,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
  Check,
} from "lucide-react";

const HistoryTab = ({ projectId }) => {
  const [allSuites, setAllSuites] = useState([]);
  const [loadingSuites, setLoadingSuites] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState(null);

  const [testRuns, setTestRuns] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  const [selectedRun, setSelectedRun] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Load suites on mount
  useEffect(() => {
    if (projectId) {
      loadSuites();
    }
  }, [projectId]);

  const loadSuites = async () => {
    try {
      setLoadingSuites(true);
      const data = await fetchsuite(projectId);
      setAllSuites(data || []);
    } catch (err) {
      console.error("Failed to load test suites:", err);
    } finally {
      setLoadingSuites(false);
    }
  };

  const handleSelectSuite = async (suite) => {
    setSelectedSuite(suite);
    setSelectedRun(null);
    try {
      setLoadingRuns(true);
      const runs = await fetchtestRuns(suite._id);
      // For Debugging
      console.log("----all the Tests----------")
      console.log(runs);
      setTestRuns(runs.testRuns || []);
    } catch (err) {
      console.error("Failed to load test runs:", err);
      setTestRuns([]);
    } finally {
      setLoadingRuns(false);
    }
  };

  // Status Badge Mapper according to TestRunSchema (`pass`, `fail`, `error`)
  const getStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "pass") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={12} /> PASS
        </span>
      );
    }
    if (s === "fail") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle size={12} /> FAIL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertTriangle size={12} /> ERROR
      </span>
    );
  };

  // Method Styling Badge
  const getMethodBadge = (method = "GET") => {
    const m = method.toUpperCase();
    const colors = {
      GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      POST: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      PUT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      DELETE: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      PATCH: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
    return (
      <span
        className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
          colors[m] || "bg-zinc-800 text-zinc-300 border-zinc-700"
        }`}
      >
        {m}
      </span>
    );
  };

  const filteredSuites = allSuites.filter((suite) =>
    suite.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      style={{ padding: "24px", minHeight: "calc(100vh - 80px)" }}
      className="w-full bg-zinc-950 text-zinc-100 font-sans antialiased flex flex-col gap-6"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2
            style={{ fontSize: "22px", fontWeight: "700" }}
            className="text-white flex items-center gap-2"
          >
            <Layers className="text-orange-500" size={24} /> Execution History
          </h2>
          <p
            style={{ fontSize: "13px", marginTop: "4px" }}
            className="text-zinc-400"
          >
            Select a suite to review execution logs, regression detection, and
            AI root cause analysis.
          </p>
        </div>

        <button
          onClick={loadSuites}
          style={{ padding: "8px 16px" }}
          className="flex items-center gap-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 transition self-start sm:self-auto"
        >
          <RefreshCw
            size={14}
            className={
              loadingSuites ? "animate-spin text-orange-500" : "text-zinc-400"
            }
          />
          Refresh Suites
        </button>
      </div>

      {/* Main 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Suites Explorer (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-zinc-500" />
            <input
              type="text"
              placeholder="Search suites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: "36px",
                paddingRight: "12px",
                paddingTop: "8px",
                paddingBottom: "8px",
              }}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          <div
            style={{ padding: "12px", borderRadius: "10px" }}
            className="bg-zinc-900/40 border border-zinc-800/80 flex-1 overflow-y-auto space-y-2 max-h-[600px]"
          >
            <div
              style={{ paddingBottom: "8px" }}
              className="text-xs font-bold text-zinc-500 uppercase tracking-wider"
            >
              Test Suites ({filteredSuites.length})
            </div>

            {loadingSuites ? (
              <div
                style={{ padding: "32px" }}
                className="text-center text-xs text-zinc-500"
              >
                Loading suites...
              </div>
            ) : filteredSuites.length === 0 ? (
              <div
                style={{ padding: "32px 16px" }}
                className="text-center text-xs text-zinc-500"
              >
                No suites found.
              </div>
            ) : (
              filteredSuites.map((suite) => {
                const isSelected = selectedSuite?._id === suite._id;
                return (
                  <div
                    key={suite._id}
                    onClick={() => handleSelectSuite(suite)}
                    style={{ padding: "12px", borderRadius: "8px" }}
                    className={`cursor-pointer transition border flex flex-col gap-2 ${
                      isSelected
                        ? "bg-orange-500/10 border-orange-500/40 text-white"
                        : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Folder
                          size={18}
                          style={{ color: suite.color || "#7c3aed" }}
                          className="shrink-0"
                        />
                        <span
                          style={{ fontSize: "13px", fontWeight: "600" }}
                          className="truncate"
                        >
                          {suite.name}
                        </span>
                      </div>
                      <ChevronRight
                        size={16}
                        className={
                          isSelected ? "text-orange-500" : "text-zinc-600"
                        }
                      />
                    </div>

                    {/* Suite Stats directly from TestSuiteSchema.stats */}
                    {suite.stats && (
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                        <span>Total: {suite.stats.totalTests || 0}</span>
                        <span className="text-emerald-400">
                          Pass: {suite.stats.passing || 0}
                        </span>
                        <span className="text-rose-400">
                          Fail: {suite.stats.failing || 0}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Test Runs List (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {!selectedSuite ? (
            <div
              style={{ padding: "48px 24px", borderRadius: "10px" }}
              className="bg-zinc-900/20 border border-dashed border-zinc-800 text-center flex flex-col items-center justify-center h-full min-h-[300px]"
            >
              <Folder size={36} className="text-zinc-700 mb-3" />
              <div
                style={{ fontSize: "14px", fontWeight: "600" }}
                className="text-zinc-300"
              >
                No Suite Selected
              </div>
              <p
                style={{ fontSize: "12px", marginTop: "4px" }}
                className="text-zinc-500"
              >
                Select a suite from the left sidebar to load its linked
                execution history.
              </p>
            </div>
          ) : (
            <div
              style={{ padding: "20px", borderRadius: "10px" }}
              className="bg-zinc-900/40 border border-zinc-800 flex-1 flex flex-col"
            >
              <div
                style={{ marginBottom: "16px" }}
                className="flex items-center justify-between pb-3 border-b border-zinc-800"
              >
                <div>
                  <h3
                    style={{ fontSize: "16px", fontWeight: "700" }}
                    className="text-white flex items-center gap-2"
                  >
                    <Folder
                      size={18}
                      style={{ color: selectedSuite.color || "#7c3aed" }}
                    />{" "}
                    {selectedSuite.name}
                  </h3>
                  <span style={{ fontSize: "12px" }} className="text-zinc-500">
                    Showing test execution history
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "4px 10px",
                    borderRadius: "12px",
                  }}
                  className="bg-zinc-800 text-zinc-300 font-mono"
                >
                  {testRuns.length} Runs
                </span>
              </div>

              {/* Runs List */}
              {loadingRuns ? (
                <div
                  style={{ padding: "48px" }}
                  className="text-center text-xs text-zinc-500 flex items-center justify-center gap-2"
                >
                  <RefreshCw
                    size={14}
                    className="animate-spin text-orange-500"
                  />{" "}
                  Loading test runs...
                </div>
              ) : testRuns.length === 0 ? (
                <div
                  style={{ padding: "48px 16px" }}
                  className="text-center text-xs text-zinc-500"
                >
                  No execution runs linked to this suite yet.
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[520px]">
                  {testRuns.map((run) => {
                    const isSelected = selectedRun?._id === run._id;
                    const snapshot = run.requestSnapshot || {};

                    return (
                      <div
                        key={run._id}
                        onClick={() => setSelectedRun(run)}
                        style={{ padding: "14px 16px", borderRadius: "8px" }}
                        className={`cursor-pointer transition border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-orange-500/10 border-orange-500/40"
                            : "bg-zinc-900 hover:bg-zinc-800/80 border-zinc-800/80"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {getMethodBadge(snapshot.method || "GET")}
                          <span
                            style={{ fontSize: "13px" }}
                            className="font-mono text-zinc-200 truncate"
                          >
                            {snapshot.url || "Unknown Endpoint"}
                          </span>

                          {/* Regression Chip Tag */}
                          {run.isRegression && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              <Zap size={10} /> REGRESSION
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-zinc-400 shrink-0">
                          <div className="flex items-center gap-1 font-mono">
                            <Clock size={12} className="text-zinc-500" />
                            <span>
                              {run.responseTime != null
                                ? `${run.responseTime}ms`
                                : "—"}
                            </span>
                          </div>
                          {getStatusBadge(run.status)}
                          <ArrowRight size={14} className="text-zinc-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Detailed Inspector Drawer for Selected Test Run */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div
            style={{ width: "100%", maxWidth: "620px", padding: "24px" }}
            className="bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto flex flex-col gap-5 shadow-2xl animate-in slide-in-from-right duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileJson className="text-orange-500" size={20} />
                <h3
                  style={{ fontSize: "16px", fontWeight: "700" }}
                  className="text-white"
                >
                  Test Run Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                style={{ padding: "6px" }}
                className="text-zinc-400 hover:text-white bg-zinc-900 rounded-lg border border-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Run Metadata Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div
                style={{ padding: "10px", borderRadius: "8px" }}
                className="bg-zinc-900/60 border border-zinc-800"
              >
                <span
                  style={{ fontSize: "10px" }}
                  className="text-zinc-500 uppercase font-bold"
                >
                  Status
                </span>
                <div style={{ marginTop: "4px" }}>
                  {getStatusBadge(selectedRun.status)}
                </div>
              </div>

              <div
                style={{ padding: "10px", borderRadius: "8px" }}
                className="bg-zinc-900/60 border border-zinc-800"
              >
                <span
                  style={{ fontSize: "10px" }}
                  className="text-zinc-500 uppercase font-bold"
                >
                  HTTP Status
                </span>
                <div
                  style={{ marginTop: "4px", fontSize: "12px" }}
                  className="font-mono text-zinc-200"
                >
                  {selectedRun.actualStatus || "N/A"}{" "}
                  <span className="text-zinc-500">
                    (Exp: {selectedRun.expectedStatus})
                  </span>
                </div>
              </div>

              <div
                style={{ padding: "10px", borderRadius: "8px" }}
                className="bg-zinc-900/60 border border-zinc-800"
              >
                <span
                  style={{ fontSize: "10px" }}
                  className="text-zinc-500 uppercase font-bold"
                >
                  Latency
                </span>
                <div
                  style={{ marginTop: "4px", fontSize: "12px" }}
                  className="font-mono text-zinc-200"
                >
                  {selectedRun.responseTime != null
                    ? `${selectedRun.responseTime} ms`
                    : "—"}
                </div>
              </div>
            </div>

            {/* AI Failure Analysis Section (If generated) */}
            {selectedRun.aiAnalysis?.generated && (
              <div
                style={{ padding: "14px", borderRadius: "8px" }}
                className="bg-orange-950/20 border border-orange-500/30 space-y-2"
              >
                <div className="flex items-center gap-2 text-orange-400 font-semibold text-xs">
                  <Sparkles size={14} /> AI Failure Root Cause Analysis
                </div>
                <p style={{ fontSize: "12px" }} className="text-zinc-300">
                  {selectedRun.aiAnalysis.shortExplanation}
                </p>
                {selectedRun.aiAnalysis.suggestedFix && (
                  <div
                    style={{ marginTop: "8px", paddingTop: "8px" }}
                    className="border-t border-orange-500/20 text-xs"
                  >
                    <span className="text-orange-400 font-semibold">
                      Suggested Fix:{" "}
                    </span>
                    <span className="text-zinc-300">
                      {selectedRun.aiAnalysis.suggestedFix}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Target Endpoint */}
            <div className="space-y-1">
              <label
                style={{ fontSize: "10px" }}
                className="text-zinc-500 uppercase font-bold"
              >
                Request Snapshot Endpoint
              </label>
              <div
                style={{ padding: "10px 12px", borderRadius: "6px" }}
                className="bg-zinc-900 border border-zinc-800 font-mono text-xs text-orange-400 flex items-center gap-2"
              >
                {getMethodBadge(selectedRun.requestSnapshot?.method || "GET")}
                <span className="truncate">
                  {selectedRun.requestSnapshot?.url || "N/A"}
                </span>
              </div>
            </div>

            {/* Assertion Results Breakdown */}
            {selectedRun.assertionResults &&
              selectedRun.assertionResults.length > 0 && (
                <div className="space-y-2">
                  <label
                    style={{ fontSize: "10px" }}
                    className="text-zinc-500 uppercase font-bold"
                  >
                    Assertion Breakdown ({selectedRun.assertionResults.length})
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedRun.assertionResults.map((assert, i) => (
                      <div
                        key={i}
                        style={{ padding: "8px 12px", borderRadius: "6px" }}
                        className="bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <span className="font-mono text-zinc-300">
                          {assert.assertion}
                        </span>
                        {assert.passed ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                            <Check size={12} /> Passed
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1 font-semibold text-[11px]">
                            <X size={12} /> Failed
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Request Body Payload */}
            <div className="space-y-1">
              <label
                style={{ fontSize: "10px" }}
                className="text-zinc-500 uppercase font-bold"
              >
                Request Snapshot Body
              </label>
              <pre
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  lineHeight: "1.4",
                }}
                className="bg-zinc-900/90 border border-zinc-800 text-emerald-400 font-mono overflow-x-auto max-h-36"
              >
                {selectedRun.requestSnapshot?.body
                  ? JSON.stringify(selectedRun.requestSnapshot.body, null, 2)
                  : "// No request body"}
              </pre>
            </div>

            {/* Actual Response Body */}
            <div className="space-y-1">
              <label
                style={{ fontSize: "10px" }}
                className="text-zinc-500 uppercase font-bold"
              >
                Actual Response Body
              </label>
              <pre
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  lineHeight: "1.4",
                }}
                className="bg-zinc-900/90 border border-zinc-800 text-zinc-300 font-mono overflow-x-auto max-h-44"
              >
                {selectedRun.actualBody
                  ? typeof selectedRun.actualBody === "object"
                    ? JSON.stringify(selectedRun.actualBody, null, 2)
                    : selectedRun.actualBody
                  : "// Empty or null response body"}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
