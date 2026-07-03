"use client";
import { useState } from "react";

export default function KeyValueEditor({ pairs, onChange, label, onSave }) {
  const [isSaving, setIsSaving] = useState(false);

  const handleKeyChange = (index, newKey) => {
    const updated = [...pairs];
    updated[index] = { ...updated[index], key: newKey };
    onChange(updated);
  };

  const handleValueChange = (index, newValue) => {
    const updated = [...pairs];
    updated[index] = { ...updated[index], value: newValue };
    onChange(updated);
  };

  const handleAddRow = () => {
    onChange([...pairs, { key: "", value: "" }]);
  };

  const handleRemoveRow = (index) => {
    const updated = pairs.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleTriggerSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(pairs);
    } catch (err) {
      console.error("Failed to sync structural entries:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col select-none w-full bg-[#0d0e12]">
      {/* 1. SECTOR METRIC HEADER HEADER (With conditional frontend update hook) */}
      <div
        style={{ marginBottom: "12px" }}
        className="flex items-center justify-between"
      >
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
          {label || "Parameters Configuration"}
        </span>

        {/* Renders conditionally only if onSave is supplied via the parent popover component */}
        {onSave ? (
          <button
            type="button"
            onClick={handleTriggerSave}
            disabled={isSaving}
            style={{ padding: "3px 10px", border: "1px solid #0369a1" }}
            className="text-[9px] font-mono font-bold text-sky-400 bg-sky-950/20 hover:bg-sky-500/10 hover:text-sky-300 disabled:opacity-40 uppercase cursor-pointer outline-none rounded-none transition-all duration-150 active:scale-[0.97]"
          >
            {isSaving ? "Syncing..." : "Sync Jar"}
          </button>
        ) : (
          <span className="text-[9px] font-mono font-bold text-amber-500/60 bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 uppercase">
            Dynamic Rows
          </span>
        )}
      </div>

      {/* 2. INDUSTRIAL DATA FIELD LAYOUT RUNWAY */}
      <div className="flex flex-col gap-2 w-full">
        {pairs.map((pair, index) => (
          <div
            key={index}
            style={{ padding: "3px 6px" }}
            className="flex items-center w-full bg-[#16171d] border border-zinc-800/60 group transition-all duration-200 hover:border-zinc-700"
          >
            {/* KEY INPUT BLOCK WRAPPER */}
            <div className="flex items-center flex-1 min-w-0 bg-[#0f1015] border border-zinc-800/80 px-2 h-7">
              <span className="text-[10px] font-mono font-bold tracking-wider text-amber-500/80 select-none uppercase pr-1.5 border-r border-zinc-800/60 mr-2">
                Key:
              </span>
              <input
                type="text"
                value={pair.key}
                onChange={(e) => handleKeyChange(index, e.target.value)}
                className="w-full bg-transparent text-xs font-mono text-emerald-400 font-medium placeholder-zinc-700 focus:outline-none"
                placeholder="param_name"
              />
            </div>

            {/* SEPARATOR GAP ACCENT */}
            <div
              style={{ width: "1px", height: "14px" }}
              className="bg-zinc-800/80 shrink-0 mx-1.5"
            />

            {/* VALUE INPUT BLOCK WRAPPER */}
            <div className="flex items-center flex-1 min-w-0 bg-[#0f1015] border border-zinc-800/80 px-2 h-7">
              <span className="text-[10px] font-mono font-bold tracking-wider text-blue-400/80 select-none uppercase pr-1.5 border-r border-zinc-800/60 mr-2">
                Value:
              </span>
              <input
                type="text"
                value={pair.value}
                onChange={(e) => handleValueChange(index, e.target.value)}
                className="w-full bg-transparent text-xs font-mono text-zinc-200 placeholder-zinc-700 focus:outline-none"
                placeholder="value_string"
              />
            </div>

            {/* DESTRUCTIVE ACTION MARKER */}
            <button
              type="button"
              onClick={() => handleRemoveRow(index)}
              style={{ padding: "4px 8px", marginLeft: "4px" }}
              className="text-[10px] font-mono font-bold text-zinc-600 hover:text-rose-400 border-0 bg-transparent outline-none cursor-pointer transition-colors opacity-40 group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* 3. FLUSH SOLID SOLID ACTION FOOTER TRACK */}
      <button
        type="button"
        onClick={handleAddRow}
        style={{ marginTop: "12px", padding: "8px" }}
        className="w-full flex items-center justify-center gap-2 bg-[#16171d] hover:bg-[#1c1d25] border border-zinc-800/80 hover:border-zinc-700 text-[10px] font-mono font-bold tracking-widest text-zinc-400 hover:text-zinc-100 uppercase transition-all duration-150 active:scale-[0.99]"
      >
        <span>+ Add Key-Value Frame</span>
      </button>
    </div>
  );
}
