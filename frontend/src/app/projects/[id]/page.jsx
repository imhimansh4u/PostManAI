"use client";

import { useState } from "react";
import Sidebar from "@/components/project/sidebar";
import MainArea from "@/components/project/MainArea";

const page = () => {
  const [activeTab, setActiveTab] = useState("test");

  return (
    <div className="flex w-full h-screen bg-[#06060a]">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <MainArea activeTab={activeTab} />
    </div>
  );
};

export default page;
