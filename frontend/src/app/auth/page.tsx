"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function AuthPage() {
    const router = useRouter();
    const { login, register, isLoading, error, clearError } = useAuthStore();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        clearError();
        try {
            if (mode === "login") {
                await login(email, password);
            } else {
                await register(email, password, fullName);
            }
            router.push("/dashboard");
        } catch { }
    }

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "radial-gradient(ellipse at 50% 10%, rgba(108,99,255,0.18) 0%, var(--bg-base) 65%)",
            padding: "24px",
        }}>
            {/* Logo / hero */}
            <div style={{ maxWidth: 420, width: "100%" }}>
                <div className="text-center" style={{ marginBottom: 40 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: "var(--radius-lg)",
                        background: "linear-gradient(135deg, var(--brand-primary), #9b59b6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 16px", fontSize: 28,
                        boxShadow: "var(--shadow-glow)",
                    }}>🏛️</div>
                    <h1 style={{ fontSize: 26, marginBottom: 6 }}>ArchPlan AI</h1>
                    <p className="text-secondary">AI-powered floor plan generation & VR walkthrough</p>
                </div>

                <div className="card" style={{ padding: "32px" }}>
                    {/* Tabs */}
                    <div className="tabs" style={{ marginBottom: 28 }}>
                        <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Sign In</button>
                        <button className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>Create Account</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {mode === "register" && (
                            <div style={{ marginBottom: 16 }}>
                                <label className="input-label">Full Name</label>
                                <input className="input" type="text" placeholder="Jane Doe" value={fullName} onChange={e => setFullName(e.target.value)} />
                            </div>
                        )}
                        <div style={{ marginBottom: 16 }}>
                            <label className="input-label">Email</label>
                            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <label className="input-label">Password</label>
                            <input className="input" type="password" placeholder={mode === "register" ? "min 8 chars" : "••••••••"} value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === "register" ? 8 : 1} />
                        </div>

                        {error && (
                            <div style={{
                                padding: "10px 14px",
                                background: "rgba(255,101,132,0.1)",
                                border: "1px solid rgba(255,101,132,0.3)",
                                borderRadius: "var(--radius-md)",
                                color: "var(--red)",
                                fontSize: 13,
                                marginBottom: 16,
                            }}>{error}</div>
                        )}

                        <button className="btn btn-primary" type="submit" style={{ width: "100%" }} disabled={isLoading}>
                            {isLoading ? <span className="spinner" /> : (mode === "login" ? "Sign In" : "Create Account")}
                        </button>
                    </form>
                </div>

                <p className="text-center text-muted" style={{ marginTop: 24, fontSize: 12 }}>
                    Secure · Private · Your designs, always yours
                </p>
            </div>
        </div>
    );
}
