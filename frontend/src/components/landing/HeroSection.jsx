"use client";
import { useEffect, useState } from "react";
const DEMO_EXAMPLES = [
  {
    prompt: "test if login fails with wrong password",
    result: {
      method: "POST",
      url: "/api/auth/login",
      expectedStatus: 401,
      assertions: ["body.error exists"],
    },
  },
  {
    prompt: "check if product list returns 200",
    result: {
      method: "GET",
      url: "/api/products",
      expectedStatus: 200,
      assertions: ["body.products is array"],
    },
  },
  {
    prompt: "test if cart add works for logged in user",
    result: {
      method: "POST",
      url: "/api/cart/add",
      expectedStatus: 201,
      assertions: ["body.cartId exists"],
    },
  },
  {
    prompt: "verify signup rejects duplicate email",
    result: {
      method: "POST",
      url: "/api/auth/register",
      expectedStatus: 410,
      assertions: ["body.message exists"],
    },
  },
];

export default function HeroSection() {
  // ── Animation States
  const [exampleIndex, setExampleIndex] = useState(0); // which example showing
  const [typedText, setTypedText] = useState(""); // current typed text
  const [isTyping, setIsTyping] = useState(true); // currently typing?
  const [showResult, setShowResult] = useState(false); // show JSON result?
  const [showGenerating, setShowGenerating] = useState(false); // show "Generating..."

  const current = DEMO_EXAMPLES[exampleIndex];

  useEffect(() => {
    // --- Reset everythinh when example changes
    setTypedText("");
    setShowResult(false);
    setShowGenerating(false);
    setIsTyping(true);
  }, [exampleIndex]);

  useEffect(() => {
    const fullText = current.prompt;

    // Still typing — add one character at a time
    if (typedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1));
      }, 50); // ← typing speed (ms per character)
      return () => clearTimeout(timeout);
    }

    // Typing finished — run the post-typing sequence (generating → result → next)
    if (typedText.length === fullText.length) {
      let generatingTimeout = null;
      let resultTimeout = null;
      let nextTimeout = null;

      generatingTimeout = setTimeout(() => {
        setIsTyping(false);
        setShowGenerating(true);

        resultTimeout = setTimeout(() => {
          setShowGenerating(false);
          setShowResult(true);

          nextTimeout = setTimeout(() => {
            setExampleIndex((prev) => (prev + 1) % DEMO_EXAMPLES.length);
          }, 3000); // ← how long result stays visible
        }, 1000); // ← how long "Generating..." shows
      }, 500); // ← pause after typing before "Generating..."

      return () => {
        clearTimeout(generatingTimeout);
        clearTimeout(resultTimeout);
        clearTimeout(nextTimeout);
      };
    }
  }, [typedText, current]);

  return (
    <section className="min-h-screen flex flex-col  items-center  text-center  bg-[#080808]">
      {/* ── HEADLINE ── */}
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
        {/* PostmanAI — in orange gradient */}
        <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent">
          PostmanAI
        </span>

        {/* Separator dash — muted, not orange */}
        <span className="text-zinc-500 font-light mx-3">—</span>

        {/* Test Smarter, — pure white */}
        <span className="text-white">Test Smarter,</span>

        {/* Ship Faster. — slightly muted white, new line */}
        <br />
        <span className="text-zinc-300 font-semibold">Build Faster.</span>
      </h1>
      {/* ── DEMO BOX ── */}
      <div
        style={{
          marginTop: "50px",
          width: "100%",
          maxWidth: "680px",
          backgroundColor: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          overflow: "hidden",
          textAlign: "left",
        }}
      >
        {/* ── Header Bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            backgroundColor: "#111111",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#ff5f57",
            }}
          />
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#febc2e",
            }}
          />
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#28c840",
            }}
          />
          <span
            style={{
              marginLeft: "8px",
              fontSize: "12px",
              color: "#52525b",
              fontFamily: "monospace",
            }}
          >
            postmanai — terminal
          </span>
        </div>

        {/* ── Content Area ── */}
        <div
          style={{
            padding: "20px",
            minHeight: "220px",
            fontFamily: "monospace",
            fontSize: "13px",
          }}
        >
          {/* ── Prompt Line ── */}
          <div style={{ marginBottom: "16px" }}>
            <span style={{ color: "#f97316" }}>➜</span>
            <span style={{ color: "#71717a" }}> ~ </span>
            <span style={{ color: "#e4e4e7" }}>{typedText}</span>

            {/* Blinking cursor — only shows while typing */}
            {isTyping && (
              <span
                style={{
                  display: "inline-block",
                  width: "2px",
                  height: "14px",
                  backgroundColor: "#f97316",
                  marginLeft: "2px",
                  verticalAlign: "middle",
                  animation: "blink 1s step-end infinite",
                }}
              />
            )}
          </div>

          {/* ── Generating text ── */}
          {showGenerating && !showResult && (
            <div
              style={{
                color: "#52525b",
                fontSize: "12px",
                marginBottom: "12px",
              }}
            >
              generating test
              <span style={{ animation: "blink 1s step-end infinite" }}>
                ...
              </span>
            </div>
          )}

          {/* ── JSON Result ── */}
          {showResult && (
            <div
              style={{
                backgroundColor: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px",
                padding: "14px",
                animation: "fadeIn 0.4s ease",
              }}
            >
              <div style={{ color: "#71717a" }}>{`{`}</div>

              <div style={{ paddingLeft: "16px" }}>
                <JsonLine
                  label="method"
                  value={`"${current.result.method}"`}
                  valueColor="#86efac"
                />
                <JsonLine
                  label="url"
                  value={`"${current.result.url}"`}
                  valueColor="#93c5fd"
                />
                <JsonLine
                  label="expectedStatus"
                  value={current.result.expectedStatus}
                  valueColor="#fbbf24"
                />
                <JsonLine
                  label="assertions"
                  value={`["${current.result.assertions[0]}"]`}
                  valueColor="#86efac"
                />
              </div>

              <div style={{ color: "#71717a" }}>{`}`}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── CSS for animations ── */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </section>
  );
}

// ── Helper component for each JSON line
function JsonLine({ label, value, valueColor }) {
  return (
    <div style={{ marginBottom: "4px" }}>
      <span style={{ color: "#f97316" }}>&quot;{label}&quot;</span>
      <span style={{ color: "#71717a" }}>: </span>
      <span style={{ color: valueColor }}>{value}</span>
      <span style={{ color: "#71717a" }}>,</span>
    </div>
  );
}
