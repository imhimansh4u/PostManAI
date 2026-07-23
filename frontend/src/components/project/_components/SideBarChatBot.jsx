"use client";

import { useEffect, useState } from "react";
import { Bot, SendHorizonal, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startChat, sendChatMessage } from "@/app/lib/chatApi";

const starterPrompts = [
  "Help me debug this error",
  "Suggest a likely fix",
  "What should I check next?",
];

const extractAssistantText = (payload) => {
  const candidates = [
    payload?.reply,
    payload?.message,
    payload?.response,
    payload?.content,
    payload?.data?.reply,
    payload?.data?.message,
    payload?.data?.response,
    payload?.data?.content,
    payload?.result?.reply,
    payload?.result?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "I’m ready to help analyze this test run and suggest the next best step.";
};

const findRunId = (payload) => {
  const candidates = [
    payload?.testRunId,
    payload?.test_run_id,
    payload?.raw?.data?.testRunId,
    payload?.raw?.data?.test_run_id,
    payload?.raw?.testRunId,
    payload?.raw?.test_run_id,
    payload?.data?.testRunId,
    payload?.data?.test_run_id,
    payload?.result?.testRunId,
    payload?.result?.test_run_id,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
};

export default function SideBarChatBot({
  projectName = "this project",
  testRunData,
}) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [chatError, setChatError] = useState("");

  const runId = findRunId(testRunData);
  const isEnabled = Boolean(runId);

  // Logical check to see if the user has started typing/interacting
  const hasChatStarted = messages.some((m) => m.role === "user");

  useEffect(() => {
    if (!isEnabled) {
      setChatReady(false);
      setChatError("");
      setMessages([]);
      return;
    }

    const beginSession = async () => {
      setChatReady(true);
      setIsThinking(true);
      setChatError("");
      setMessages([
        {
          id: 1,
          role: "assistant",
          content: `I'm ready to inspect this test run and help troubleshoot it for ${projectName}.`,
        },
      ]);

      try {
        const response = await startChat(runId);
        const assistantText = extractAssistantText(response?.data || response);
        setMessages([
          {
            id: 1,
            role: "assistant",
            content: assistantText,
          },
        ]);
      } catch (error) {
        setChatError(
          error?.response?.data?.message || "Chat could not be started.",
        );
        setMessages([
          {
            id: 1,
            role: "assistant",
            content: `Hi! I can help discuss errors, issues, and suggested fixes for ${projectName}.`,
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    };

    beginSession();
  }, [isEnabled, projectName, runId]);

  const handleSend = async (value = draft) => {
    const text = value.trim();
    if (!text || !isEnabled || !chatReady) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setIsThinking(true);
    setChatError("");

    try {
      const response = await sendChatMessage(runId, text);
      const assistantText = extractAssistantText(response?.data || response);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: assistantText,
        },
      ]);
    } catch (error) {
      setChatError(
        error?.response?.data?.message ||
          "The assistant could not respond right now.",
      );
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "The assistant could not respond right now. Please try again.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div
      className="flex h-180 w-full flex-col"
      style={{ padding: "12px", margin: 0 }}
    >
      <Card className="flex h-full flex-col border-zinc-800 bg-zinc-950/80 text-zinc-200 shadow-none overflow-hidden">
        <CardHeader
          className="shrink-0 border-b border-zinc-900"
          style={{
            paddingTop: "16px",
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingBottom: "12px",
          }}
        >
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
            <Bot className="h-4 w-4 text-amber-400" />
            Error Copilot
          </CardTitle>
          <p className="text-[11px] text-zinc-500" style={{ marginTop: "4px" }}>
            Discuss issues, errors, and fixes 
          </p>
        </CardHeader>

        <CardContent
          className="flex flex-1 flex-col min-h-0 justify-between"
          style={{
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "16px",
            paddingBottom: "16px",
            gap: "16px",
          }}
        >
          {/* Scrollable chat body container */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-3">
            {!isEnabled && (
              <div
                className="rounded-lg border border-amber-500/20 bg-amber-500/10 text-[11px] leading-5 text-amber-100"
                style={{ padding: "10px" }}
              >
                Complete a test run first and the assistant will activate here.
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg text-xs leading-5 custom-message-glow ${
                  message.role === "user"
                    ? "ml-auto max-w-[85%] bg-amber-500/10 border border-amber-500/20 text-amber-100"
                    : "mr-auto max-w-[90%] bg-zinc-900/50 border border-zinc-800/60 text-zinc-300"
                }`}
                style={{ padding: "10px 12px", marginTop: "2px" }}
              >
                <div
                  className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500 font-medium"
                  style={{ marginBottom: "6px" }}
                >
                  {message.role === "user" ? (
                    <Sparkles className="h-3 w-3 text-amber-400" />
                  ) : (
                    <Bot className="h-3 w-3 text-zinc-400" />
                  )}
                  {message.role === "user" ? "You" : "Assistant"}
                </div>
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </div>
            ))}

            {isThinking && (
              <div
                className="mr-auto max-w-[90%] rounded-lg bg-zinc-900/30 border border-zinc-800/40 text-xs text-zinc-400 animate-pulse"
                style={{ padding: "10px 12px" }}
              >
                <div
                  className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500 font-medium"
                  style={{ marginBottom: "4px" }}
                >
                  <Bot className="h-3 w-3" /> Assistant
                </div>
                Thinking through the issue...
              </div>
            )}
          </div>

          {/* Locked Interaction anchor layout wrapper */}
          <div
            className="shrink-0 flex flex-col border-t border-zinc-900/60"
            style={{ gap: "12px", paddingTop: "12px" }}
          >
            {/* Renders starter choices only if the conversation has not begun */}
            {!hasChatStarted && isEnabled && chatReady && (
              <div className="flex flex-wrap" style={{ gap: "6px" }}>
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    disabled={!isEnabled || !chatReady || isThinking}
                    className="rounded-full border border-zinc-800 bg-zinc-900/40 text-[10px] font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ padding: "6px 12px" }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Locked input entry controls */}
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <textarea
                value={draft}
                disabled={!isEnabled || !chatReady}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                rows={2}
                placeholder={
                  isEnabled
                    ? "Describe the error or issue..."
                    : "Complete a test run to unlock chat"
                }
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-700 transition resize-none"
                style={{ padding: "10px 12px" }}
              />

              <div
                className="flex items-center justify-between"
                style={{ gap: "10px" }}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                  <AlertCircle className="h-3 w-3 text-zinc-600" />
                  Error-focused help
                </div>
                <Button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={
                    !isEnabled || !chatReady || isThinking || !draft.trim()
                  }
                  size="sm"
                  className="h-8 gap-1.5 rounded-md bg-amber-500 px-3 text-[11px] font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <SendHorizonal className="h-3.5 w-3.5" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
