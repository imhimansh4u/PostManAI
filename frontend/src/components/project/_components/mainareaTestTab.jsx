// @/app/projects/[id]/_components/MainAreaTestTab.jsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTests, updateTest, runTest } from "@/app/lib/testApi";
import KeyValueEditor from "./KeyValueEditor";
import { Editor } from "@monaco-editor/react";
import { toast } from "sonner";

export default function MainAreaTestTab({ mode, onTestExecuted }) {
  const params = useParams();
  const projectId = params?.id;

  const [prompt, setPrompt] = useState("");
  const [generatedCases, setGeneratedCases] = useState([]);
  const [currentAIIndex, setCurrentAIIndex] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const currentCase = generatedCases[currentAIIndex];
  const [method, setMethod] = useState(currentCase?.method || "GET");
  const storageKey = projectId ? `testDraft-${projectId}` : "testDraft";
  const [allparams, setParams] = useState([]);
  // For setting the path
  const [url, setUrl] = useState(currentCase?.url || "");
  // for headers
  const [headers, setHeaders] = useState([]);
  // Now for states for Authorizations
  const [authType, setAuthType] = useState("Inherit");
  const [authToken, setAuthToken] = useState(""); // Bearer or API-Key value
  const [authHeaderName, setAuthHeaderName] = useState("x-api-key"); // API-Key header name
  const [basicUsername, setBasicUsername] = useState("");
  const [basicPassword, setBasicPassword] = useState("");
  // state for the management of body
  const [bodyCode, setBodyCode] = useState("{}");
  // Now managing the after Response thing
  //
  const [isSending, setIsSending] = useState(false);
  const [responsePanelOpen, setResponsePanelOpen] = useState(false); //  For the response our Backend will Give us
  const [apiResponse, setApiResponse] = useState(null);
  // Manages workspace view tracking without breaking element containers
  const [currentSubTab, setCurrentSubTab] = useState("body"); // "body" or "response"

  // Simulated network dispatch execution method
  const handleSendRequest = async () => {
    setIsSending(true);
    setError("");

    if (!projectId) {
      setError("Missing project context.");
      setIsSending(false);
      return;
    }

    if (!currentCase || !currentCase._id) {
      setError("No test case selected to run.");
      setIsSending(false);
      return;
    }

    // parse body
    let parsedBody = null;
    try {
      parsedBody = JSON.parse(bodyCode || "null");
    } catch (err) {
      setError("Invalid JSON in request body.");
      setIsSending(false);
      return;
    }

    const headersObject = headers.reduce((acc, pair) => {
      if (pair.key && pair.key.trim()) acc[pair.key] = pair.value;
      return acc;
    }, {});

    // build testCase payload expected by backend
    const authPayload = { type: authType };
    if (authType === "Bearer") {
      authPayload.token = authToken;
    } else if (authType === "API-Key") {
      authPayload.token = authToken;
      authPayload.headerName = authHeaderName;
    } else if (authType === "Basic") {
      authPayload.token = btoa(`${basicUsername}:${basicPassword}`);
    }

    const testCasePayload = {
      method,
      url: url || "/",
      headers: headersObject,
      body: parsedBody,
      expectedStatus: currentCase?.expectedStatus || 200,
      assertions: currentCase?.assertions || [],
      auth: authPayload,
      captureAuthToken: authType === "Bearer" && Boolean(authToken),
    };

    try {
      const resp = await runTest({
        testId: currentCase._id,
        projectId,
        testCase: testCasePayload,
      });

      const data = resp?.data || resp; // follow existing helper patterns
      setApiResponse(data);
      setResponsePanelOpen(true);
      setCurrentSubTab("response");
      toast.success("Response received.");
      // notify parent MainArea so side panel can use this response too
      if (typeof onTestExecuted === "function") onTestExecuted(data);
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Request failed.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  // This useEffect is for changing the content after each render of the new cases
  useEffect(() => {
    if (currentCase) {
      setUrl(currentCase.url);
      setMethod(currentCase.method);
      const paramsArray = Object.entries(currentCase.queryParams || {}).map(
        ([key, value]) => ({ key, value }),
      );
      const headersArray = Object.entries(currentCase.headers || {}).map(
        ([key, value]) => ({ key, value }),
      );
      setAuthType(currentCase.auth?.type || "Inherit");
      setAuthToken(currentCase.auth?.token || "");
      setAuthHeaderName(currentCase.auth?.headerName || "x-api-key");
      setHeaders(headersArray);
      setParams(paramsArray);
      // Sync Monaco editor body whenever the selected case changes
      setBodyCode(JSON.stringify(currentCase.body || {}, null, 2));
    }
  }, [currentAIIndex, generatedCases]);

  // storing the things into browsers localStorage , so that if we refresh the page , the fetched data doesnt washed away
  useEffect(() => {
    if (!projectId) return;

    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (!savedDraft) return;

      const parsedDraft = JSON.parse(savedDraft);
      if (parsedDraft.prompt) setPrompt(parsedDraft.prompt);
      if (Array.isArray(parsedDraft.generatedCases)) {
        setGeneratedCases(parsedDraft.generatedCases);
      }
      if (typeof parsedDraft.currentAIIndex === "number") {
        setCurrentAIIndex(parsedDraft.currentAIIndex);
      }
      if (typeof parsedDraft.hasGenerated === "boolean") {
        setHasGenerated(parsedDraft.hasGenerated);
      }
    } catch {
      // ignore invalid saved data
    }
  }, [projectId, storageKey]);

  // managing the localstorage from the browser
  useEffect(() => {
    if (!projectId) return;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          prompt,
          generatedCases,
          currentAIIndex,
          hasGenerated,
        }),
      );
    } catch {
      // ignore storage write errors
    }
  }, [
    projectId,
    storageKey,
    prompt,
    generatedCases,
    currentAIIndex,
    hasGenerated,
  ]);

  // To handle the click next Button
  const handleNextCase = () => {
    if (generatedCases.length === 0) return;

    setCurrentAIIndex((prevIndex) => (prevIndex + 1) % generatedCases.length);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please describe the test you want to generate.");
      return;
    }

    if (!projectId) {
      setError("Project details are missing.");
      return;
    }
    setIsGenerating(true);
    setError("");

    try {
      const response = await getTests(projectId, prompt.trim());
      const payload = response?.data || {};
      const tests = payload.tests || [];
      console.log(tests[0]);

      if (!Array.isArray(tests) || tests.length === 0) {
        setError("No test cases were returned by the server.");
        setHasGenerated(false);
        return;
      }

      setGeneratedCases(tests);
      setCurrentAIIndex(0);
      setHasGenerated(true);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.response?.data?.data?.message ||
        err?.message ||
        "Something went wrong while generating tests.";

      setError(message);
      setHasGenerated(false);
    } finally {
      setIsGenerating(false);
    }
  };
  // Handle the Update of test case
  const handleUpdate = async () => {
    const testid = currentCase?._id.toString();

    // Parse body — return early if invalid JSON
    let body = {};
    try {
      body = JSON.parse(bodyCode);
    } catch {
      setError("Invalid JSON in request body. Please fix before saving.");
      return;
    }

    // Convert allparams array → object
    const queryParams = allparams.reduce((acc, pair) => {
      if (pair.key.trim()) acc[pair.key] = pair.value;
      return acc;
    }, {});

    // Convert headers array → object
    const headersObject = headers.reduce((acc, pair) => {
      if (pair.key.trim()) acc[pair.key] = pair.value;
      return acc;
    }, {});

    // Build auth object based on selected type
    let auth = { type: authType };
    if (authType === "Bearer") {
      auth.token = authToken;
    } else if (authType === "API-Key") {
      auth.token = authToken;
      auth.headerName = authHeaderName;
    } else if (authType === "Basic") {
      auth.token = btoa(`${basicUsername}:${basicPassword}`);
    }

    const update = {
      method,
      url,
      queryParams,
      headers: headersObject,
      body,
      auth,
    };

    try {
      await updateTest(testid, update);
      setError("");
      // optional: show success toast here
      toast.success("Test Update Successfull....");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update test case.",
      );
    }
  };

  if (mode === "ai") {
    return (
      <div className="flex flex-col h-full gap-4 px-4 py-2 animate-fadeIn">
        {/* ─── PROMPT BOX AREA ─── */}
        <div className="ai-prompt-panel-wrap">
          <div className="ai-prompt-panel">
            <div className="ai-prompt-box">
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(
                    e.target.scrollHeight,
                    180,
                  )}px`;
                }}
                rows={1}
                placeholder="Describe your test case here..."
                className="ai-prompt-input"
              />

              <button
                onClick={handleGenerate}
                type="button"
                className="ai-generate-btn"
                disabled={isGenerating}
              >
                <span>{isGenerating ? "Generating..." : "Generate"}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M13 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          <style jsx>{`
            .ai-prompt-panel-wrap {
              width: 100%;
              padding: 24px 16px;
            }

            .ai-prompt-panel {
              width: 100%;
              max-width: 980px;
              margin: 0 auto;
              background: linear-gradient(180deg, #111214 0%, #0b0b0d 100%);
              border: 1px solid #2a2a2f;
              border-radius: 18px;
              overflow: hidden;
              box-shadow:
                0 10px 30px rgba(0, 0, 0, 0.45),
                inset 0 1px 0 rgba(255, 255, 255, 0.03);
            }

            .ai-prompt-box {
              display: flex;
              align-items: flex-end;
              gap: 12px;
              padding: 14px;
              background:
                radial-gradient(
                  circle at top,
                  rgba(255, 255, 255, 0.04),
                  transparent 35%
                ),
                #101114;
            }

            .ai-prompt-input {
              flex: 1;
              resize: none;
              border: 1px solid #2b2b30;
              border-radius: 14px;
              background: #0d0d0f;
              color: #f4f4f5;
              padding: 14px 16px;
              font-size: 14px;
              line-height: 1.5;
              min-height: 52px;
              max-height: 180px;
              overflow-y: auto;
              outline: none;
              font-family: inherit;
              transition:
                border-color 0.2s ease,
                background 0.2s ease;
            }

            .ai-prompt-input::placeholder {
              color: #7a7a80;
            }

            .ai-prompt-input:focus {
              border-color: #4b5563;
              background: #111217;
            }

            .ai-generate-btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              border: 1px solid #3a3a40;
              background: linear-gradient(180deg, #1a1a1f 0%, #131318 100%);
              color: #f5f5f5;
              font-weight: 600;
              font-size: 13px;
              padding: 0 16px;
              height: 52px;
              border-radius: 14px;
              cursor: pointer;
              white-space: nowrap;
              transition:
                transform 0.15s ease,
                background 0.2s ease,
                border-color 0.2s ease;
              box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.04),
                0 6px 18px rgba(0, 0, 0, 0.25);
            }

            .ai-generate-btn:hover {
              background: linear-gradient(180deg, #212129 0%, #17171c 100%);
              border-color: #56565f;
              transform: translateY(-1px);
            }

            .ai-generate-btn:disabled {
              cursor: not-allowed;
              opacity: 0.7;
            }

            .ai-generate-btn svg {
              width: 17px;
              height: 17px;
              stroke: #d9d9de;
            }
          `}</style>
          {/* // Here We Will show the Case no. and its Name, */}
          <div
            style={{ marginTop: "12px", padding: "8px 16px" }}
            className="w-full max-w-[820px] mx-auto flex items-center justify-between bg-gradient-to-br from-[#121318] via-[#0d0d11] to-[#08080b] shadow-[0_4px_24px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.03)] transition-all duration-300 select-none"
          >
            {/* Left Section: Meta Indicators and Dynamic Labels */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Test Number Box Badge */}
              <span
                style={{ padding: "3px 8px" }}
                className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 tracking-wider uppercase shrink-0"
              >
                Test {currentAIIndex + 1}
              </span>

              {/* Test Case Text Name Description */}
              <span className="text-xs font-mono font-medium text-zinc-300 truncate">
                {currentCase?.name || "Untitled Test Configuration Step"}
              </span>
            </div>

            {/* Right Section: Transparent Interaction Button Hook */}
            <button
              onClick={handleNextCase}
              style={{ padding: "6px 12px", marginLeft: "16px" }}
              className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase bg-transparent border-0 outline-none cursor-pointer select-none transition-all duration-150 hover:text-zinc-100 active:scale-[0.93] active:text-zinc-500"
            >
              Next →
            </button>
          </div>
          <div
            style={{ padding: "4px 8px" }}
            className="w-full max-w-[820px] mx-auto flex items-center justify-between bg-gradient-to-br from-[#121318] via-[#0d0d11] to-[#08080b] shadow-[0_4px_24px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.03)] transition-all duration-300 relative select-none"
          >
            {/* For the Method Choosing */}
            <div
              style={{ padding: "2px" }}
              className="flex items-center w-full max-w-[820px] mx-auto border border-zinc-800"
            >
              {/* 1. METHOD SELECTOR CONTAINEr */}
              <div className="shrink-0 flex items-center">
                <Select value={method} onValueChange={setMethod}>
                  {/* Rectangular flat trigger */}
                  <SelectTrigger className="w-[110px] bg-transparent border-0 text-xs font-mono font-bold tracking-wider h-9 text-zinc-200 focus:ring-0 focus:ring-offset-0 rounded-none cursor-pointer px-3 justify-between">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  {/* Fixed bottom rectangular menu block to prevent layout drift */}
                  <SelectContent
                    side="bottom"
                    sideOffset={4}
                    align="start"
                    position="popper"
                    className="bg-[#0c0c12] border border-zinc-800 rounded-none w-[110px] shadow-2xl p-0.5"
                  >
                    <SelectItem
                      value="GET"
                      style={{ padding: "8px 12px" }}
                      className="text-emerald-400 font-bold font-mono text-xs rounded-none cursor-pointer transition-colors focus:bg-emerald-500/10 focus:text-emerald-400"
                    >
                      GET
                    </SelectItem>

                    <SelectItem
                      value="POST"
                      style={{ padding: "8px 12px" }}
                      className="text-amber-400 font-bold font-mono text-xs rounded-none cursor-pointer transition-colors focus:bg-amber-500/10 focus:text-amber-400"
                    >
                      POST
                    </SelectItem>

                    <SelectItem
                      value="PUT"
                      style={{ padding: "8px 12px" }}
                      className="text-blue-400 font-bold font-mono text-xs rounded-none cursor-pointer transition-colors focus:bg-blue-500/10 focus:text-blue-400"
                    >
                      PUT
                    </SelectItem>

                    <SelectItem
                      value="PATCH"
                      style={{ padding: "8px 12px" }}
                      className="text-purple-400 font-bold font-mono text-xs rounded-none cursor-pointer transition-colors focus:bg-purple-500/10 focus:text-purple-400"
                    >
                      PATCH
                    </SelectItem>

                    <SelectItem
                      value="DELETE"
                      style={{ padding: "8px 12px" }}
                      className="text-rose-400 font-bold font-mono text-xs rounded-none cursor-pointer transition-colors focus:bg-rose-500/10 focus:text-rose-400"
                    >
                      DELETE
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 2. HIGH-QUALITY ORANGISH SEPARATOR LINE */}
              <div
                style={{ width: "1px", height: "20px" }}
                className="bg-gradient-to-b from-orange-400 via-amber-500 to-orange-600 opacity-80 shrink-0"
              />

              {/* 3. ENDPOINT PATH INPUT CONTAINER */}
              <div
                style={{ paddingLeft: "12px", paddingRight: "12px" }}
                className="flex-1"
              >
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none font-mono py-1.5"
                  placeholder="/api/v1/endpoint"
                />
              </div>
            </div>
            {/* Now For the Selecting Query Params */}
            <div className="flex items-center ml-auto shrink-0">
              {/* 1. QUERY PARAMS TRIGGER BOX */}
              <div className="flex items-center">
                <Popover>
                  <PopoverTrigger
                    style={{ padding: "6px 14px" }}
                    className="bg-transparent border-0 text-xs font-mono font-bold tracking-wider text-zinc-400 hover:text-zinc-100 uppercase cursor-pointer transition-colors outline-none rounded-none"
                  >
                    Params
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    sideOffset={6}
                    align="end"
                    className="w-[360px] bg-[#0c0c12] border border-zinc-800 rounded-none shadow-2xl p-4 mt-1"
                  >
                    <KeyValueEditor
                      pairs={allparams}
                      onChange={setParams}
                      label="Query Parameters"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* GLOWING ORANGISH SEPARATOR LINE */}
              <div
                style={{ width: "1px", height: "16px" }}
                className="bg-gradient-to-b from-orange-400 via-amber-500 to-orange-600 opacity-80 shrink-0"
              />

              {/* 2. HTTP HEADERS TRIGGER BOX */}
              <div className="flex items-center">
                <Popover>
                  <PopoverTrigger
                    style={{ padding: "6px 14px" }}
                    className="bg-transparent border-0 text-xs font-mono font-bold tracking-wider text-zinc-400 hover:text-zinc-100 uppercase cursor-pointer transition-colors outline-none rounded-none"
                  >
                    Headers
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    sideOffset={6}
                    align="end"
                    className="w-[380px] bg-[#0c0c12] border border-zinc-800 rounded-none shadow-2xl p-4 mt-1"
                  >
                    <KeyValueEditor
                      pairs={headers}
                      onChange={setHeaders}
                      label="HTTP Headers"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* GLOWING ORANGISH SEPARATOR LINE */}
              <div
                style={{ width: "1px", height: "16px" }}
                className="bg-gradient-to-b from-orange-400 via-amber-500 to-orange-600 opacity-80 shrink-0"
              />

              {/* 3. CONDITIONAL AUTHORIZATION MASTER CONTROLLER PANEL */}
              <div className="flex items-center">
                <Popover>
                  <PopoverTrigger
                    style={{ padding: "6px 14px" }}
                    className="bg-transparent border-0 text-xs font-mono font-bold tracking-wider text-zinc-400 hover:text-zinc-100 uppercase cursor-pointer transition-colors outline-none rounded-none"
                  >
                    Authorization
                  </PopoverTrigger>

                  <PopoverContent
                    side="bottom"
                    sideOffset={6}
                    align="end"
                    className="w-[420px] flex-row bg-[#0c0c12] border border-zinc-800 rounded-none shadow-2xl p-0 mt-1 overflow-hidden flex"
                  >
                    {/* LEFT PANEL — Auth Type Selector Runway */}
                    <div
                      style={{ paddingTop: "8px", paddingBottom: "8px" }}
                      className="w-[140px] border-r border-zinc-800/80 bg-[#09090f]/50 shrink-0 flex flex-col"
                    >
                      {["Inherit", "Bearer", "API-Key", "Basic", "None"].map(
                        (type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setAuthType(type)}
                            style={{ padding: "8px 12px" }}
                            className={`w-full flex items-center gap-2.5 text-left text-[11px] font-mono font-medium tracking-wide transition-colors cursor-pointer border-0 bg-transparent outline-none rounded-none ${
                              authType === type
                                ? "text-amber-400 bg-zinc-900/40 font-bold"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20"
                            }`}
                          >
                            {/* Custom High-Contrast Indicator Dot */}
                            <div
                              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                                authType === type
                                  ? "bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]"
                                  : "bg-zinc-700"
                              }`}
                            />
                            <span>{type === "API-Key" ? "API Key" : type}</span>
                          </button>
                        ),
                      )}
                    </div>

                    {/* RIGHT PANEL — Multi-Option Conditional Forms Canvas */}
                    <div
                      style={{ padding: "16px" }}
                      className="flex-1 min-w-0 bg-[#0c0c12] flex flex-col justify-center"
                    >
                      {authType === "Inherit" && (
                        <p className="text-xs font-mono text-zinc-500 leading-relaxed">
                          Uses the project's default global authorization
                          parameters.
                        </p>
                      )}

                      {authType === "None" && (
                        <p className="text-xs font-mono text-zinc-500 leading-relaxed">
                          No authorization attributes will be appended to this
                          network header bundle.
                        </p>
                      )}

                      {authType === "Bearer" && (
                        <div className="flex flex-col gap-2 w-full">
                          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                            Bearer Access Token
                          </label>
                          <input
                            type="text"
                            value={authToken}
                            onChange={(e) => setAuthToken(e.target.value)}
                            style={{ padding: "8px 12px" }}
                            className="bg-[#050508] border border-zinc-800 text-xs font-mono text-zinc-200 rounded-none w-full focus:outline-none focus:border-zinc-700 placeholder-zinc-700"
                            placeholder="eyJhbGciOiJIUzI1Ni..."
                          />
                        </div>
                      )}

                      {authType === "API-Key" && (
                        <div className="flex flex-col gap-3 w-full">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                              Header Parameter Key
                            </label>
                            <input
                              type="text"
                              value={authHeaderName}
                              onChange={(e) =>
                                setAuthHeaderName(e.target.value)
                              }
                              style={{ padding: "8px 12px" }}
                              className="bg-[#050508] border border-zinc-800 text-xs font-mono text-zinc-200 rounded-none w-full focus:outline-none focus:border-zinc-700 placeholder-zinc-700"
                              placeholder="X-API-Key"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                              Key Value Secret
                            </label>
                            <input
                              type="text"
                              value={authToken}
                              onChange={(e) => setAuthToken(e.target.value)}
                              style={{ padding: "8px 12px" }}
                              className="bg-[#050508] border border-zinc-800 text-xs font-mono text-zinc-200 rounded-none w-full focus:outline-none focus:border-zinc-700 placeholder-zinc-700"
                              placeholder="api_live_hidden_sec..."
                            />
                          </div>
                        </div>
                      )}

                      {authType === "Basic" && (
                        <div className="flex flex-col gap-3 w-full">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                              Username Identifier
                            </label>
                            <input
                              type="text"
                              value={basicUsername}
                              onChange={(e) => setBasicUsername(e.target.value)}
                              style={{ padding: "8px 12px" }}
                              className="bg-[#050508] border border-zinc-800 text-xs font-mono text-zinc-200 rounded-none w-full focus:outline-none focus:border-zinc-700 placeholder-zinc-700"
                              placeholder="admin_root"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                              Access Password
                            </label>
                            <input
                              type="password"
                              value={basicPassword}
                              onChange={(e) => setBasicPassword(e.target.value)}
                              style={{ padding: "8px 12px" }}
                              className="bg-[#050508] border border-zinc-800 text-xs font-mono text-zinc-200 rounded-none w-full focus:outline-none focus:border-zinc-700 placeholder-zinc-700"
                              placeholder="••••••••••••"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          {/* Now The Button that Update the Test cases and Send Button */}
          <div
            style={{
              marginTop: "16px",
              marginBottom: "12px",
              padding: "6px 12px",
            }}
            className="w-full max-w-[820px] mx-auto flex items-center select-none"
          >
            {/* LEFT CORNER: RECTANGULAR UPDATE WORKSPACE TRIGGER BUTTON */}
            <div className="shrink-0">
              <button
                onClick={handleUpdate}
                type="button"
                style={{ padding: "6px 14px", border: "1px solid #27272a" }}
                className="text-[11px] font-mono font-bold tracking-wider text-zinc-400 bg-[#16171d]/40 hover:text-zinc-100 hover:border-zinc-700 uppercase cursor-pointer outline-none rounded-none transition-all duration-150 active:scale-[0.97]"
              >
                Update
              </button>
            </div>

            {/* MAIN RUNWAY TITLE BANNER ACCENT */}
            <div
              style={{ marginLeft: "14px" }}
              className="flex items-center gap-2"
            >
              <div
                style={{ width: "4px", height: "4px" }}
                className="bg-zinc-800 shrink-0"
              />
              <span className="text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase antialiased">
                Test Case
              </span>
            </div>

            {/* RIGHT CORNER: SOLID GREEN SEND BUTTON WITH SVG ICON */}
            <div style={{ marginLeft: "auto" }} className="shrink-0">
              <button
                onClick={handleSendRequest}
                disabled={isSending}
                type="button"
                style={{ padding: "6px 16px" }}
                className="inline-flex items-center gap-2 text-[11px] font-mono font-bold tracking-widest text-white bg-emerald-600 hover:bg-emerald-500 border-0 uppercase cursor-pointer outline-none rounded-none transition-all duration-150 active:scale-[0.96] shadow-md shadow-black/20"
              >
                {isSending ? "Sending..." : "Send"}

                {/* Crisp inline SVG Send Icon */}
                <svg
                  className="w-3.5 h-3.5 fill-current transform -rotate-45 relative top-[1px]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
          {/* Now The Monaco Body Editor */}
          <div
            style={{ marginTop: "12px" }}
            className="w-full max-w-[820px] mx-auto flex flex-col bg-gradient-to-br from-[#121318] via-[#0d0d11] to-[#08080b] shadow-[0_4px_24px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.03)] select-none"
          >
            {/* 2. MONACO EDITOR CANVAS CONTAINER */}
            {/* ─── WORKSPACE PANEL: TABS TOGGLE VIEWER ─── */}
            <div
              style={{ marginTop: "12px" }}
              className="w-full max-w-[820px] mx-auto flex flex-col bg-gradient-to-br from-[#121318] via-[#0d0d11] to-[#08080b] shadow-[0_4px_24px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.035)] select-none"
            >
              {/* TABS INTERACTIVE HEADER TRAIL */}
              <div
                style={{ padding: "4px 12px" }}
                className="flex items-center justify-between border-b border-zinc-800/60 bg-black/20"
              >
                <div className="flex items-center gap-1">
                  {/* 1. Request Body Tab Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentSubTab("body")}
                    style={{ padding: "6px 12px" }}
                    className={`text-[10px] font-mono font-bold tracking-wider uppercase border-0 bg-transparent outline-none cursor-pointer transition-colors ${
                      currentSubTab === "body"
                        ? "text-amber-500 font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Request Body
                  </button>

                  {/* Micro vertical accent marker */}
                  <span className="text-zinc-800 font-mono text-[10px]">/</span>

                  {/* 2. Dynamic Response Tab Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (responsePanelOpen) setCurrentSubTab("response");
                    }}
                    disabled={!responsePanelOpen}
                    style={{ padding: "6px 12px" }}
                    className={`text-[10px] font-mono font-bold tracking-wider uppercase border-0 bg-transparent outline-none relative transition-colors ${
                      !responsePanelOpen
                        ? "opacity-30 cursor-not-allowed text-zinc-600"
                        : currentSubTab === "response"
                          ? "text-emerald-400 font-extrabold"
                          : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Response Console
                    {responsePanelOpen && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                    )}
                  </button>
                </div>

                {/* Dynamic Status / Indicator Tag on the right edge */}
                <div className="flex items-center gap-2">
                  {currentSubTab === "body" ? (
                    <span className="text-[9px] font-mono font-bold text-amber-500/50 bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 uppercase">
                      payload.json
                    </span>
                  ) : (
                    apiResponse && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/20 uppercase">
                          {apiResponse.status} {apiResponse.statusText}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-zinc-500">
                          {apiResponse.time}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* LOWER CONTENT WINDOW CANVAS */}
              <div style={{ padding: "12px" }} className="w-full">
                {currentSubTab === "body" ? (
                  /* VIEW A: WORKSPACE INPUT EDITOR */
                  <Editor
                    key="request-body-editor"
                    height="320px"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={bodyCode}
                    onChange={(value) => setBodyCode(value || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      fontFamily:
                        "var(--font-mono), Menlo, Monaco, 'Courier New', monospace",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      lineNumbersMinChars: 3,
                      glyphMargin: false,
                      folding: true,
                      lineDecorationsWidth: 10,
                      scrollbar: {
                        vertical: "visible",
                        horizontal: "visible",
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                        useShadows: false,
                      },
                      renderLineHighlight: "all",
                    }}
                  />
                ) : (
                  /* VIEW B: READ-ONLY OUTPUT DISPLAY */
                  apiResponse && (
                    <Editor
                      key="response-payload-viewer"
                      height="320px"
                      defaultLanguage="json"
                      theme="vs-dark"
                      value={JSON.stringify(apiResponse.body, null, 2)}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        fontFamily:
                          "var(--font-mono), Menlo, Monaco, 'Courier New', monospace",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        readOnly: true,
                        lineNumbersMinChars: 3,
                        glyphMargin: false,
                        folding: true,
                        lineDecorationsWidth: 10,
                        scrollbar: {
                          vertical: "visible",
                          horizontal: "visible",
                          verticalScrollbarSize: 8,
                          horizontalScrollbarSize: 8,
                          useShadows: false,
                        },
                        renderLineHighlight: "none",
                      }}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "normal") {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-800/60 p-6 text-zinc-500 font-mono text-xs">
        <span>Normal Mode Suite View</span>
      </div>
    );
  }

  return null;
}
