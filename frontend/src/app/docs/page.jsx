"use client";

import React, { useState } from "react";
import { FaGithub } from "react-icons/fa";
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Info,
  Zap,
  Shield,
  Layers,
  Menu,
  X,
  Bot,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

export default function DocumentationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const navigation = [
    {
      title: "Getting Started",
      items: [
        { id: "overview", label: "Overview & Scope" },
        { id: "prerequisites", label: "Prerequisites" },
        { id: "step-by-step", label: "Step-by-Step Guide" },
      ],
    },
    {
      title: "Core Features",
      items: [
        { id: "features", label: "Platform Highlights" },
        { id: "test-suites", label: "TestSuites & Organization" },
        { id: "context-ai", label: "Context-Aware Chatbot" },
      ],
    },
    {
      title: "Limits & Considerations",
      items: [
        { id: "rate-limits", label: "Sync Limits & Tokens" },
        { id: "limitations", label: "Current Limitations" },
      ],
    },
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setSidebarOpen(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#09090b",
        color: "#f4f4f5",
      }}
      className="w-full font-sans antialiased"
    >
      {/* Mobile Sidebar Toggle Button */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #27272a",
          backgroundColor: "#09090b",
        }}
        className="flex items-center justify-between lg:hidden sticky top-0 z-50"
      >
        <div className="flex items-center gap-2 font-bold text-lg text-white">
          <Zap size={20} className="text-orange-500 fill-orange-500" />
          <span>
            Postman<span className="text-orange-500">AI</span>
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ padding: "8px", borderRadius: "6px" }}
          className="bg-zinc-900 text-zinc-400 hover:text-white"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex w-full min-h-screen">
        {/* Left Sidebar Navigation */}
        <aside
          style={{
            width: "280px",
            backgroundColor: "#09090b",
            borderRight: "1px solid #27272a",
            padding: "24px 16px",
          }}
          className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } flex flex-col justify-between shrink-0`}
        >
          <div>
            {/* PostmanAI Brand Header */}
            <div
              style={{ marginBottom: "28px", paddingLeft: "8px" }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-white">
                <div
                  style={{
                    backgroundColor: "rgba(249, 115, 22, 0.15)",
                    padding: "6px",
                    borderRadius: "8px",
                  }}
                >
                  <Zap size={20} className="text-orange-500 fill-orange-500" />
                </div>
                <span>
                  Postman<span className="text-orange-500">AI</span>
                </span>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(249, 115, 22, 0.1)",
                  color: "#f97316",
                  border: "1px solid rgba(249, 115, 22, 0.2)",
                }}
                className="font-mono font-semibold"
              >
                v1.0 Docs
              </span>
            </div>

            {/* Navigation Groups */}
            <nav className="space-y-6">
              {navigation.map((group) => (
                <div key={group.title}>
                  <h3
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                      paddingLeft: "8px",
                    }}
                    className="font-bold uppercase text-zinc-500"
                  >
                    {group.title}
                  </h3>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = activeSection === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => scrollToSection(item.id)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontWeight: isActive ? "600" : "400",
                              backgroundColor: isActive
                                ? "rgba(249, 115, 22, 0.1)"
                                : "transparent",
                              color: isActive ? "#f97316" : "#a1a1aa",
                              borderLeft: isActive
                                ? "3px solid #f97316"
                                : "3px solid transparent",
                            }}
                            className="w-full text-left transition hover:bg-zinc-900 hover:text-zinc-200"
                          >
                            {item.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* GitHub Repo Quicklink at Sidebar Bottom */}
          <div style={{ paddingTop: "16px", borderTop: "1px solid #27272a" }}>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              style={{ padding: "10px 12px", borderRadius: "8px" }}
              className="flex items-center gap-2.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition w-full border border-zinc-800"
            >
              <FaGithub size={16} className="text-orange-500" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </aside>

        {/* Main Documentation Body (Utilizes Whole Remaining Screen Width) */}
        <main
          style={{ padding: "40px 48px" }}
          className="flex-1 max-w-5xl mx-auto overflow-y-auto"
        >
          {/* Section: Overview */}
          <section
            id="overview"
            style={{ marginBottom: "48px" }}
            className="scroll-mt-10"
          >
            <h1
              style={{
                fontSize: "36px",
                fontWeight: "800",
                marginBottom: "16px",
                letterSpacing: "-0.02em",
              }}
              className="text-white"
            >
              PostmanAI Documentation
            </h1>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.7",
                color: "#a1a1aa",
                marginBottom: "28px",
              }}
            >
              PostmanAI is an intelligent, developer-first API testing and
              debugging platform powered by Large Language Models (LLMs). By
              indexing your repository's codebase, PostmanAI auto-generates test
              schemas, paths, payloads, and assertions—drastically reducing
              repetitive manual work.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                }}
              >
                <div className="flex items-center gap-2 text-orange-500 font-semibold text-sm mb-2">
                  <Zap size={18} /> Intelligent Context
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: "1.5",
                    color: "#a1a1aa",
                  }}
                >
                  Parses your codebase structure automatically so you don't have
                  to write payloads manually.
                </p>
              </div>

              <div
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                }}
              >
                <div className="flex items-center gap-2 text-orange-500 font-semibold text-sm mb-2">
                  <Shield size={18} /> Automated Cookies
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: "1.5",
                    color: "#a1a1aa",
                  }}
                >
                  Automatically extracts and passes session cookies across
                  sequential API test calls.
                </p>
              </div>
            </div>
          </section>

          {/* Callout Notice: Free Token Warning */}
          <div
            style={{
              padding: "16px 20px",
              borderRadius: "10px",
              backgroundColor: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              marginBottom: "40px",
            }}
            className="flex gap-3 text-amber-200"
          >
            <AlertTriangle
              size={20}
              className="text-amber-400 shrink-0 mt-0.5"
            />
            <div>
              <span
                style={{ fontSize: "14px", fontWeight: "600" }}
                className="text-amber-300"
              >
                Notice on Free AI Token Limits:
              </span>
              <p
                style={{
                  fontSize: "13px",
                  marginTop: "4px",
                  lineHeight: "1.6",
                }}
                className="text-amber-200/80"
              >
                Currently, PostmanAI utilizes free-tier LLM API tokens to run
                intelligent code analyses. During peak hours, response
                generation times may slightly delay, or requests may fail if
                token quotas are exhausted. If you encounter issues, please
                retry after a short moment.
              </p>
            </div>
          </div>

          <hr style={{ borderColor: "#27272a", marginBottom: "40px" }} />

          {/* Section: Prerequisites */}
          <section
            id="prerequisites"
            style={{ marginBottom: "48px" }}
            className="scroll-mt-10"
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "16px",
              }}
              className="text-white flex items-center gap-2.5"
            >
              <FaGithub className="text-orange-500" size={22} /> Prerequisites
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#a1a1aa",
                marginBottom: "16px",
              }}
            >
              Before setting up a project on PostmanAI, ensure you have isolated
              your code cleanly:
            </p>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>
                  <strong className="text-white">
                    Separate Testing Repository:
                  </strong>{" "}
                  We highly recommend creating a dedicated repository on GitHub
                  solely for testing and debugging purposes.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>
                  <strong className="text-white">GitHub Authorization:</strong>{" "}
                  Connect your GitHub account to grant PostmanAI read
                  permissions to parse route files and schemas.
                </span>
              </li>
            </ul>
          </section>

          {/* Section: Step-by-Step Guide */}
          <section
            id="step-by-step"
            style={{ marginBottom: "48px" }}
            className="scroll-mt-10"
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "24px",
              }}
              className="text-white"
            >
              Step-by-Step Usage Guide
            </h2>

            <ol className="space-y-6 relative border-l border-zinc-800 ml-4 pl-6">
              <li className="relative">
                <div
                  style={{
                    backgroundColor: "#f97316",
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    left: "-38px",
                  }}
                  className="absolute top-0 flex items-center justify-center text-xs font-bold text-black"
                >
                  1
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "4px",
                  }}
                  className="text-white"
                >
                  Connect GitHub & Create Project
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#a1a1aa",
                    lineHeight: "1.6",
                  }}
                >
                  Log into PostmanAI, connect your GitHub account, and click{" "}
                  <span className="text-orange-400 font-mono text-xs bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    Create Project
                  </span>{" "}
                  on the Dashboard.
                </p>
              </li>

              <li className="relative">
                <div
                  style={{
                    backgroundColor: "#f97316",
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    left: "-38px",
                  }}
                  className="absolute top-0 flex items-center justify-center text-xs font-bold text-black"
                >
                  2
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "4px",
                  }}
                  className="text-white"
                >
                  Select Repository & Target Branch
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#a1a1aa",
                    lineHeight: "1.6",
                  }}
                >
                  Select your repository and choose the specific branch that
                  contains the routes, controllers, or API schemas you want
                  passed to the LLM.
                </p>
              </li>

              <li className="relative">
                <div
                  style={{
                    backgroundColor: "#f97316",
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    left: "-38px",
                  }}
                  className="absolute top-0 flex items-center justify-center text-xs font-bold text-black"
                >
                  3
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "4px",
                  }}
                  className="text-white"
                >
                  Sync & Index Codebase
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#a1a1aa",
                    lineHeight: "1.6",
                    marginBottom: "10px",
                  }}
                >
                  Click on the <strong className="text-white">Sync</strong>{" "}
                  button. PostmanAI will process and vector-index your codebase.
                </p>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                  }}
                  className="flex items-center gap-2.5 text-xs text-zinc-400"
                >
                  <RefreshCw className="text-orange-500 h-4 w-4 shrink-0" />
                  Note: Codebase indexing enables context awareness for test
                  generation.
                </div>
              </li>

              <li className="relative">
                <div
                  style={{
                    backgroundColor: "#f97316",
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    left: "-38px",
                  }}
                  className="absolute top-0 flex items-center justify-center text-xs font-bold text-black"
                >
                  4
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "4px",
                  }}
                  className="text-white"
                >
                  Generate Tests in Plain English
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#a1a1aa",
                    lineHeight: "1.6",
                    marginBottom: "12px",
                  }}
                >
                  Type your prompt in simple English (e.g.,{" "}
                  <em>"Test user registration with missing password"</em>). The
                  AI outputs:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                    }}
                  >
                    ✓ Target API Paths
                  </div>
                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                    }}
                  >
                    ✓ Test Case Schemas
                  </div>
                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                    }}
                  >
                    ✓ Request Body / Headers
                  </div>
                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                    }}
                  >
                    ✓ Expected Response Status
                  </div>
                </div>
              </li>

              <li className="relative">
                <div
                  style={{
                    backgroundColor: "#f97316",
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    left: "-38px",
                  }}
                  className="absolute top-0 flex items-center justify-center text-xs font-bold text-black"
                >
                  5
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "4px",
                  }}
                  className="text-white"
                >
                  Validate & Execute
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#a1a1aa",
                    lineHeight: "1.6",
                  }}
                >
                  Review the auto-generated data, edit parameter values if
                  needed, and execute the request.
                </p>
              </li>
            </ol>
          </section>

          {/* Callout Notice: Unconnected Execution */}
          <div
            style={{
              padding: "16px 20px",
              borderRadius: "10px",
              backgroundColor: "rgba(249, 115, 22, 0.08)",
              border: "1px solid rgba(249, 115, 22, 0.25)",
              marginBottom: "40px",
            }}
            className="flex gap-3 text-orange-200"
          >
            <Info size={20} className="text-orange-400 shrink-0 mt-0.5" />
            <div>
              <span
                style={{ fontSize: "14px", fontWeight: "600" }}
                className="text-orange-300"
              >
                Running Without GitHub Integration:
              </span>
              <p
                style={{
                  fontSize: "13px",
                  marginTop: "4px",
                  lineHeight: "1.6",
                }}
                className="text-orange-200/80"
              >
                You can run test cases without connecting a repository. However,
                the AI will provide baseline answers without codebase context,
                requiring manual field configurations.
              </p>
            </div>
          </div>

          <hr style={{ borderColor: "#27272a", marginBottom: "40px" }} />

          {/* Section: Features */}
          <section
            id="features"
            style={{ marginBottom: "48px" }}
            className="scroll-mt-10"
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "20px",
              }}
              className="text-white"
            >
              Platform Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                }}
              >
                <div className="flex items-center gap-2 font-semibold text-white mb-2 text-sm">
                  <Shield size={18} className="text-orange-500" /> Automatic
                  Cookie Catching
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#a1a1aa",
                    lineHeight: "1.6",
                  }}
                >
                  Just like native Postman, PostmanAI automatically intercepts
                  session cookies from response headers and appends them to
                  subsequent requests.
                </p>
              </div>

              <div
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                }}
              >
                <div className="flex items-center gap-2 font-semibold text-white mb-2 text-sm">
                  <CheckCircle2 size={18} className="text-emerald-400" /> Test
                  Status Tracking
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#a1a1aa",
                    lineHeight: "1.6",
                  }}
                >
                  Real-time visual markers for{" "}
                  <span className="text-emerald-400 font-semibold">PASS</span>,{" "}
                  <span className="text-rose-400 font-semibold">FAIL</span>, and{" "}
                  <span className="text-amber-400 font-semibold">
                    REGRESSION
                  </span>{" "}
                  statuses across your API suite.
                </p>
              </div>

              <div
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                }}
              >
                <div className="flex items-center gap-2 font-semibold text-white mb-2 text-sm">
                  <SlidersHorizontal size={18} className="text-orange-500" />{" "}
                  Dashboard Analytics
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#a1a1aa",
                    lineHeight: "1.6",
                  }}
                >
                  Monitor recent test runs, pass/fail percentages, average
                  response latencies, and regression logs from a single
                  dashboard.
                </p>
              </div>

              <div
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                }}
              >
                <div className="flex items-center gap-2 font-semibold text-white mb-2 text-sm">
                  <Zap size={18} className="text-orange-500" /> Minimal Manual
                  Overhead
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#a1a1aa",
                    lineHeight: "1.6",
                  }}
                >
                  Stop manually typing JSON request payloads. Let the LLM
                  construct typed payloads directly from your code definitions.
                </p>
              </div>
            </div>
          </section>

          {/* Section: TestSuites */}
          <section
            id="test-suites"
            style={{ marginBottom: "48px" }}
            className="scroll-mt-10"
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "16px",
              }}
              className="text-white flex items-center gap-2.5"
            >
              <Layers className="text-orange-500" size={22} /> TestSuites &
              Organization
            </h2>
            <p
              style={{ fontSize: "14px", color: "#a1a1aa", lineHeight: "1.7" }}
            >
              Organize individual API tests into functional{" "}
              <strong className="text-white">TestSuites</strong>. Groups can be
              organized by module (e.g., Auth, Payments, Users) and reused
              across staging or production environments.
            </p>
          </section>

          {/* Section: Context-Aware Chatbot */}
          <section
            id="context-ai"
            style={{ marginBottom: "48px" }}
            className="scroll-mt-10"
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "16px",
              }}
              className="text-white flex items-center gap-2.5"
            >
              <Bot className="text-orange-500" size={22} /> Context-Aware
              Debugging Assistant
            </h2>
            <p
              style={{ fontSize: "14px", color: "#a1a1aa", lineHeight: "1.7" }}
            >
              When an API call fails, launch the built-in AI Debugger. Because
              the assistant retains index context over your synced repository,
              it explains root causes (e.g., missing middleware, mismatched
              validation types) and suggests code fixes directly.
            </p>
          </section>

          <hr style={{ borderColor: "#27272a", marginBottom: "40px" }} />

          {/* Section: Rate Limits */}
          <section
            id="rate-limits"
            style={{ marginBottom: "48px" }}
            className="scroll-mt-10"
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "16px",
              }}
              className="text-white flex items-center gap-2.5"
            >
              <RefreshCw className="text-amber-400" size={22} /> Sync Limits &
              API Quotas
            </h2>
            <div
              style={{
                padding: "20px",
                borderRadius: "10px",
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
              }}
            >
              <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-3">
                <span className="font-semibold text-white text-sm">
                  Repository Sync Rate
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    backgroundColor: "rgba(249, 115, 22, 0.15)",
                    color: "#f97316",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}
                  className="font-mono"
                >
                  Limited per day
                </span>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#a1a1aa",
                  lineHeight: "1.6",
                }}
              >
                To prevent server overload and manage vector embedding costs,
                codebase syncing is limited to a set quota per day per account.
                Re-sync your project only after committing major structural
                changes to your API code.
              </p>
            </div>
          </section>

          {/* Section: Limitations */}
          <section
            id="limitations"
            style={{ marginBottom: "48px" }}
            className="scroll-mt-10"
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "16px",
              }}
              className="text-white flex items-center gap-2.5"
            >
              <AlertTriangle className="text-rose-500" size={22} /> Current
              Limitations
            </h2>
            <div
              style={{
                padding: "20px",
                borderRadius: "10px",
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
              }}
              className="space-y-2 text-xs text-zinc-400"
            >
              <p style={{ lineHeight: "1.6" }}>
                •{" "}
                <strong className="text-white">
                  Data Types & Body Structures:
                </strong>{" "}
                Currently, complex binary formats (like multipart file uploads
                or raw GraphQL streams) are not fully supported for
                auto-generation. These features are scheduled for future
                releases.
              </p>
              <p style={{ lineHeight: "1.6" }}>
                • <strong className="text-white">LLM Latency:</strong>{" "}
                Cold-start indexing times scale with repository size.
              </p>
            </div>
          </section>
        </main>

        {/* Right Sidebar: On This Page */}
        <aside
          style={{
            width: "220px",
            padding: "40px 24px",
            borderLeft: "1px solid #27272a",
          }}
          className="hidden xl:block sticky top-0 h-screen overflow-y-auto shrink-0"
        >
          <h4
            style={{
              fontSize: "11px",
              letterSpacing: "0.05em",
              marginBottom: "12px",
            }}
            className="font-bold uppercase text-zinc-500"
          >
            On this page
          </h4>
          <ul className="space-y-2 text-xs border-l border-zinc-800 pl-3">
            <li>
              <a
                href="#overview"
                className="text-zinc-400 hover:text-orange-500 transition block py-0.5"
              >
                Overview & Scope
              </a>
            </li>
            <li>
              <a
                href="#prerequisites"
                className="text-zinc-400 hover:text-orange-500 transition block py-0.5"
              >
                Prerequisites
              </a>
            </li>
            <li>
              <a
                href="#step-by-step"
                className="text-zinc-400 hover:text-orange-500 transition block py-0.5"
              >
                Step-by-Step Guide
              </a>
            </li>
            <li>
              <a
                href="#features"
                className="text-zinc-400 hover:text-orange-500 transition block py-0.5"
              >
                Platform Features
              </a>
            </li>
            <li>
              <a
                href="#test-suites"
                className="text-zinc-400 hover:text-orange-500 transition block py-0.5"
              >
                TestSuites
              </a>
            </li>
            <li>
              <a
                href="#context-ai"
                className="text-zinc-400 hover:text-orange-500 transition block py-0.5"
              >
                Debugging Chatbot
              </a>
            </li>
            <li>
              <a
                href="#rate-limits"
                className="text-zinc-400 hover:text-orange-500 transition block py-0.5"
              >
                Sync Limits
              </a>
            </li>
            <li>
              <a
                href="#limitations"
                className="text-zinc-400 hover:text-orange-500 transition block py-0.5"
              >
                Current Limitations
              </a>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
