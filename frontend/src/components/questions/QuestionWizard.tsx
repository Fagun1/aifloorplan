"use client";
/**
 * Question Wizard — renders pending questions from the layout engine
 * and collects answers before re-triggering generation.
 */
import { useState } from "react";

interface Question {
    id: string;
    text: string;
    type: string;
    options?: string[];
    default?: string | number | boolean;
    category: string;
    why_it_matters: string;
    priority: number;
}

interface Props {
    questions: Question[];
    onSubmit: (answers: Record<string, any>) => void;
}

export default function QuestionWizard({ questions, onSubmit }: Props) {
    const [answers, setAnswers] = useState<Record<string, any>>(() => {
        const defaults: Record<string, any> = {};
        questions.forEach(q => { if (q.default !== undefined) defaults[q.id] = q.default; });
        return defaults;
    });

    function setAnswer(id: string, val: any) {
        setAnswers(a => ({ ...a, [id]: val }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit(answers);
    }

    const categoryColors: Record<string, string> = {
        room_specification: "#6c63ff",
        lifestyle_preference: "#48c9b0",
        orientation_preference: "#f5c842",
        parking_specification: "#4a9eff",
        structural_preference: "#ff6584",
        cultural_preference: "#e67e22",
        circulation_preference: "#9b59b6",
        budget_constraint: "#27ae60",
    };

    return (
        <div className="card fade-in" style={{
            padding: "20px",
            marginBottom: 20,
            borderColor: "rgba(245, 200, 66, 0.4)",
            boxShadow: "0 0 20px rgba(245, 200, 66, 0.1)",
        }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>❓</span>
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>Additional Information Needed</h3>
                    <p className="text-muted text-sm">Answer these questions for better layouts</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {questions.map((q, idx) => (
                    <div key={q.id} style={{
                        marginBottom: 16,
                        padding: "14px",
                        background: "var(--bg-glass)",
                        borderRadius: "var(--radius-md)",
                        borderLeft: `3px solid ${categoryColors[q.category] ?? "var(--brand-primary)"}`,
                    }}>
                        <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
                            {idx + 1}. {q.text}
                        </p>
                        {q.why_it_matters && (
                            <p className="text-muted" style={{ fontSize: 11, marginBottom: 10 }}>
                                💡 {q.why_it_matters}
                            </p>
                        )}

                        {/* single_choice */}
                        {(q.type === "single_choice" || !q.type) && q.options && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {q.options.map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        className={`btn btn-sm ${answers[q.id] === opt ? "btn-primary" : "btn-secondary"}`}
                                        onClick={() => setAnswer(q.id, opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* boolean */}
                        {q.type === "boolean" && (
                            <div style={{ display: "flex", gap: 8 }}>
                                {["Yes", "No"].map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        className={`btn btn-sm ${answers[q.id] === (opt === "Yes") ? "btn-primary" : "btn-secondary"}`}
                                        onClick={() => setAnswer(q.id, opt === "Yes")}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* numeric */}
                        {q.type === "numeric" && (
                            <input
                                className="input"
                                type="number"
                                value={answers[q.id] ?? (q.default ?? "")}
                                onChange={e => setAnswer(q.id, Number(e.target.value))}
                                style={{ maxWidth: 140 }}
                            />
                        )}

                        {/* text */}
                        {q.type === "text" && (
                            <input
                                className="input"
                                type="text"
                                value={answers[q.id] ?? ""}
                                onChange={e => setAnswer(q.id, e.target.value)}
                                placeholder="Type your answer..."
                            />
                        )}

                        {/* multi_choice */}
                        {q.type === "multi_choice" && q.options && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {q.options.map(opt => {
                                    const selected = Array.isArray(answers[q.id]) && answers[q.id].includes(opt);
                                    return (
                                        <button
                                            key={opt}
                                            type="button"
                                            className={`btn btn-sm ${selected ? "btn-primary" : "btn-secondary"}`}
                                            onClick={() => {
                                                const cur: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                                                setAnswer(q.id, selected ? cur.filter(x => x !== opt) : [...cur, opt]);
                                            }}
                                        >
                                            {selected ? "✓ " : ""}{opt}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}

                <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 8 }}>
                    Submit Answers & Generate →
                </button>
            </form>
        </div>
    );
}
