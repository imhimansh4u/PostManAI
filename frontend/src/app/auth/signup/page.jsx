"use client";
import { useState } from "react";
import Image from "next/image";
import postmanaiImg from "@/app/public/postmanaiImg.png";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/lib/authApi";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    font-family: 'DM Sans', sans-serif;
  }

  .signup-wrapper {
    display: flex;
    height: 100vh;
    width: 100%;
    overflow: hidden;
  }

  /* ── LEFT PANEL ── */
  .left-panel {
    flex: 1 1 50%;
    position: relative;
    overflow: hidden;
    background: #1c3320;
  }

  .left-panel img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .left-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(10, 25, 10, 0.1) 0%,
      rgba(10, 25, 10, 0.55) 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 2.5rem;
  }

  .brand-name {
    font-family: 'Playfair Display', serif;
    font-size: 24px;
    color: #e2f0e2;
    font-weight: 500;
    letter-spacing: 0.02em;
    margin-bottom: 4px;
  }

  .brand-tagline {
    font-size: 12px;
    color: rgba(210, 235, 210, 0.65);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* ── RIGHT PANEL ── */
  .right-panel {
    flex: 1 1 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    padding: 3rem 2rem;
  }

  .form-container {
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
  }

  .form-title {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 500;
    color: #1a1a1a;
    margin-bottom: 2rem;
    line-height: 1.2;
  }

  /* ── FIELDS ── */
  .field {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
  }

  .field label {
    font-size: 13px;
    font-weight: 500;
    color: #555;
    margin-bottom: 6px;
  }

  .field input {
    height: 42px;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 0 14px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: #1a1a1a;
    background: #fff;
    outline: none;
    transition: border-color 0.2s;
  }

  .field input::placeholder {
    color: #bbb;
  }

  .field input:focus {
    border-color: #3d6b3d;
  }

  /* ── TERMS ── */
  .terms-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1.25rem;
    margin-top: 0.25rem;
  }

  .terms-row input[type="checkbox"] {
    width: 14px;
    height: 14px;
    accent-color: #3d6b3d;
    cursor: pointer;
    flex-shrink: 0;
  }

  .terms-row span {
    font-size: 12px;
    color: #666;
  }

  .terms-row a {
    color: #3d6b3d;
    text-decoration: underline;
    cursor: pointer;
  }

  /* ── BUTTONS ── */
  .btn-signup {
    width: 100%;
    height: 44px;
    background: #3d6b3d;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    margin-bottom: 1.25rem;
  }

  .btn-signup:hover {
    background: #2e5430;
  }

  .btn-signup:active {
    transform: scale(0.98);
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 1rem;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: #e8e8e8;
  }

  .divider-text {
    font-size: 12px;
    color: #aaa;
    letter-spacing: 0.04em;
  }

  .btn-oauth {
    width: 100%;
    height: 42px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    color: #333;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 0.65rem;
    transition: background 0.15s, border-color 0.15s;
  }

  .btn-oauth:hover {
    background: #f7f7f7;
    border-color: #ccc;
  }

  .btn-oauth svg {
    width: 17px;
    height: 17px;
    flex-shrink: 0;
  }

  /* ── SIGN IN LINK ── */
  .signin-row {
    text-align: center;
    font-size: 13px;
    color: #888;
    margin-top: 0.75rem;
  }

  .signin-row a {
    color: #3d6b3d;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
  }

  .signin-row a:hover {
    text-decoration: underline;
  }
`;

const GithubIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.742 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export default function SignUp() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    agreed: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear the Previous Errors.
    console.log("Form submitted:", form);
    if (!form.agreed) {
      setError("Please agree to terms and Policies");
      return;
    }
    if (!form.name || !form.email || !form.password) {
      setError("Please fill all the details");
      return;
    }
    setLoading(true);
    try {
      console.log("Calling registerUser...") // debugging 
      const res = await registerUser(form.name, form.email, form.password);
      console.log("Signup success: ", res);
      router.push("/auth/login"); // In Future push to the dashboard when it is made
    } catch (error) {
      console.error("Signup Failed,Try again.", error);
      const message =
        error.response?.data?.message || error.message || "Sign-up failed. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="signup-wrapper">
        {/* ── LEFT: Image Panel ── */}
        <div className="left-panel">
          <Image src={postmanaiImg} alt="Image here" />
          <div className="left-overlay">
            <p className="brand-name">PostmanAI</p>
            <p className="brand-tagline">API testing, reimagined</p>
          </div>
        </div>

        {/* ── RIGHT: Form Panel ── */}
        <div className="right-panel">
          <div className="form-container">
            <h1 className="form-title">Get Started Now</h1>

            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div className="terms-row">
              <input
                id="agreed"
                name="agreed"
                type="checkbox"
                checked={form.agreed}
                onChange={handleChange}
              />
              <span>
                I agree to the <a>terms &amp; policy</a>
              </span>
            </div>
            {/* ── Error Message Display ── */}
            {error && (
              <p
                style={{
                  color: "#f87171", // red color
                  fontSize: "13px",
                  marginBottom: "8px",
                  textAlign: "center",
                }}
              >
                ⚠️ {error}
              </p>
            )}
            <button className="btn-signup" onClick={handleSubmit}>
              {loading ? "Createing account...." : "Signup"}
            </button>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">Or</span>
              <div className="divider-line" />
            </div>


            <p className="signin-row">
              Have an account? <a href="/auth/login">Sign In</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
