"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/project/sidebar";
import MainArea from "@/components/project/MainArea";

const page = () => {
  const [activeTab, setActiveTab] = useState("test");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="project-page flex w-full h-screen bg-[#06060a]">
      <div className={`project-sidebar-shell ${sidebarOpen ? "is-open" : ""}`}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close project sidebar"
          className="project-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <button
        type="button"
        aria-label="Open project sidebar"
        className="project-sidebar-floating"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <MainArea activeTab={activeTab} />
    </div>
  );
};

export default page;
