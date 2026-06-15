"use client";

import React, { useEffect, useRef } from "react";
import {
  RefreshCcw,
  Trash2,
  Unplug,
  Database,
  FileCode2,
  ShieldCheck,
  X,
} from "lucide-react";

function InfoRow({ label, value, capitalize = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "6px",
      }}
      className="text-xs"
    >
      <span style={{ color: "#71717a" }}>{label}</span>
      <span
        style={{ color: "#e4e4e7", fontWeight: 500, maxWidth: "160px" }}
        className={`truncate ${capitalize ? "normalize-case capitalize" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function GithubSettingsPopup({
  open,
  triggerCoords,
  project,
  user,
  onClose,
  onSync,
  onDisconnect,
  onDeleteIndexedFiles,
  syncing,
  disconnecting,
  deletingIndexedFiles,
  isRateLimited,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open || !triggerCoords) return null;

  // Shifted up substantially (top calculation altered) to properly cross-align with the trigger gear
  const floatingStyle = {
    position: "fixed",
    top: `${Math.max(10, Math.min(triggerCoords.top - 120, window.innerHeight - 380))}px`,
    left: `${triggerCoords.left + triggerCoords.width + 12}px`,
    zIndex: 100,
    width: "320px",
    backgroundColor: "#09090b",
    border: "1px solid #27272a",
    borderRadius: "12px",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 10px 10px -5px rgba(0, 0, 0, 0.5)",
  };

  const formatDateTime = (value) => {
    if (!value) return "Not synced yet";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Invalid date"
      : date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  return (
    <div
      ref={panelRef}
      style={floatingStyle}
      className="animate-in fade-in slide-in-from-left-2 duration-150"
    >
      {/* Header Panel Layout */}
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #27272a",
        }}
      >
        <div>
          <h4
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 600,
              color: "#f4f4f5",
            }}
          >
            Repo Integration
          </h4>
          <p
            style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#71717a" }}
          >
            Manage metadata indexing
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "4px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
          className="text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Embedded Configuration Block */}
      <div style={{ padding: "14px" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}
        >
          {/* Connection Stack Info */}
          <div
            style={{
              padding: "10px",
              backgroundColor: "rgba(24, 24, 27, 0.4)",
              border: "1px solid #27272a",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "8px",
                color: "#f4f4f5",
              }}
            >
              <Database className="h-3.5 w-3.5 text-amber-500" />
              <span
                style={{ fontSize: "11px", fontWeight: 600 }}
                className="tracking-wide text-zinc-400"
              >
                CONTEXT
              </span>
            </div>
            <InfoRow
              label="User"
              value={`@${user?.github?.username || "unknown"}`}
            />
            <InfoRow
              label="Repo"
              value={project?.github?.repoFullName || "N/A"}
            />
            <InfoRow label="Branch" value={project?.github?.branch || "main"} />
            <InfoRow
              label="Status"
              value={project?.github?.indexStatus || "idle"}
              capitalize
            />
          </div>

          {/* RAG Tracking Info */}
          <div
            style={{
              padding: "10px",
              backgroundColor: "rgba(24, 24, 27, 0.4)",
              border: "1px solid #27272a",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "8px",
                color: "#f4f4f5",
              }}
            >
              <FileCode2 className="h-3.5 w-3.5 text-blue-500" />
              <span
                style={{ fontSize: "11px", fontWeight: 600 }}
                className="tracking-wide text-zinc-400"
              >
                DATA METRICS
              </span>
            </div>
            <InfoRow
              label="Endpoints"
              value={project?.github?.endpointCount ?? 0}
            />
            <InfoRow
              label="Files"
              value={project?.github?.indexedFiles?.length ?? 0}
            />
            <InfoRow
              label="Last Sync"
              value={formatDateTime(project?.github?.lastSynced)}
            />
          </div>
        </div>

        {/* Global Rate Limiting Visual Indicator */}
        {isRateLimited && (
          <div
            style={{
              marginTop: "10px",
              padding: "8px",
              backgroundColor: "rgba(220, 38, 38, 0.1)",
              border: "1px solid rgba(220, 38, 38, 0.3)",
              borderRadius: "6px",
              fontSize: "11px",
              color: "#fca5a5",
              textAlign: "center",
            }}
          >
            Daily sync capacity exhausted (Max 5/day).
          </div>
        )}

        {/* Dashboard Actions Layout */}
        <div
          style={{
            marginTop: "14px",
            paddingTop: "10px",
            borderTop: "1px solid #27272a",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={onSync}
              disabled={
                !project?.github?.repoFullName || syncing || isRateLimited
              }
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "6px",
                border: "none",
                backgroundColor: isRateLimited
                  ? "#1f2937"
                  : syncing
                    ? "#065f46"
                    : "#10b981",
                color: isRateLimited ? "#9ca3af" : "#fff",
                cursor: syncing || isRateLimited ? "not-allowed" : "pointer",
                transition: "all 150ms",
              }}
              className="hover:bg-emerald-500 active:scale-95"
            >
              <RefreshCcw
                className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing..." : isRateLimited ? "Limited" : "Sync Repo"}
            </button>

            <button
              type="button"
              onClick={onDeleteIndexedFiles}
              disabled={deletingIndexedFiles}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 500,
                borderRadius: "6px",
                border: "1px solid #3f3f46",
                backgroundColor: "#18181b",
                color: deletingIndexedFiles ? "#71717a" : "#d4d4d8",
                cursor: deletingIndexedFiles ? "not-allowed" : "pointer",
                transition: "all 150ms",
              }}
              className="hover:text-white hover:border-zinc-400 active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              {deletingIndexedFiles ? "Clearing..." : "Clear"}
            </button>
          </div>

          <button
            type="button"
            onClick={onDisconnect}
            disabled={disconnecting}
            style={{
              marginTop: "8px",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "6px 0",
              fontSize: "11px",
              fontWeight: 500,
              backgroundColor: "transparent",
              border: "1px solid transparent",
              borderRadius: "6px",
              color: "#f87171",
              cursor: "pointer",
              transition: "all 150ms",
            }}
            className="hover:bg-red-950/20 hover:border-red-900/30 disabled:opacity-40"
          >
            <Unplug className="h-3 w-3" />
            {disconnecting ? "Disconnecting..." : "Disconnect GitHub"}
          </button>
        </div>
      </div>

      {/* Structural Metadata Area Footer */}
      <div
        style={{
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          backgroundColor: "rgba(9, 9, 11, 0.6)",
          borderTop: "1px solid #27272a",
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
          fontSize: "10px",
          color: "#52525b",
        }}
      >
        <ShieldCheck
          className="h-3.5 w-3.5 text-emerald-500/70"
          style={{ marginRight: "6px" }}
        />
        <span>Securely bound via session tokens</span>
      </div>
    </div>
  );
}
