"use client";

import { useState } from "react";
import { createProject } from "@/app/lib/projectApi";
import { Button } from "@/components/ui/button";

export default function NewProjectForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    baseUrl: "",
    description: "",
    authToken: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Mandatory fields validation rule
  const isFormValid =
    formData.name.trim() !== "" && formData.baseUrl.trim() !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createProject(formData);
      console.log("Submitting Project Data: ", formData);

      // Reset form and call successful callback to refresh the parent listing
      setFormData({ name: "", baseUrl: "", description: "", authToken: "" });
      onSuccess();
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[400px] p-6 relative animation-fade-in">
      {/* Top Header Row with Red Close Text Button */}
      <div
        style={{ marginBottom : "30px" }}
        className="flex items-center justify-between border-b border-zinc-800/60 pb-4 mb-4"
      >
        <h3 className="text-lg font-semibold text-white">Create New Project</h3>
        <button
          onClick={onClose}
          type="button"
          className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
        >
          Close
        </button>
      </div>
      <div style={{}}>
        {/* Form Fields Stack */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Scrollable Container wrapper */}
          <div className="flex-1 space-y-4 overflow-auto pr-2">
            <div style={{marginBottom : "20px"}} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Project Name Field (Mandatory) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  style={{padding:"5px"}}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Core Auth Service"
                  required
                  className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition-colors"
                />
              </div>

              {/* Base URL Field (Mandatory) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Base URL <span className="text-red-500">*</span>
                </label>
                <input
                  style={{padding : "5px"}}
                  type="url"
                  name="baseUrl"
                  value={formData.baseUrl}
                  onChange={handleChange}
                  placeholder="https://api.example.com"
                  required
                  className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition-colors"
                />
              </div>
            </div>

            {/* Auth Token Field */}
            <div style={{marginBottom : "20px"}} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Auth Token / Bearer Key
              </label>
              <input
                style={{padding:"5px"}}
                type="password"
                name="authToken"
                value={formData.authToken}
                onChange={handleChange}
                placeholder="Optional authorization header token"
                className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 transition-colors"
              />
            </div>

            {/* Description Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Description
              </label>
              <textarea
                style={{padding: "10px"}}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the purpose of this project..."
                rows={3}
                className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-amber-500/80 transition-colors"
              />
            </div>
          </div>{" "}
          {/* <-- Fixed: Added missing closing tag for the flex-1 scrollable div */}
          {/* Submit Actions Row */}
          <div style={{marginTop:"5px"}} className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              style={{
                backgroundColor:
                isFormValid && !isSubmitting ? "#fbbf24" : "#27272a",
                color: isFormValid && !isSubmitting ? "#000000" : "#71717a",
                fontSize: "13px",
                fontWeight: "700",
                borderRadius: "8px",
                border: "none",
                padding: "10px 24px",
                cursor:
                  isFormValid && !isSubmitting ? "pointer" : "not-allowed",
                transition: "all 0.2s",
              }}
            >
              {isSubmitting ? "Creating..." : "Submit Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
