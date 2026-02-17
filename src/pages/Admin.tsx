import { useEffect, useState } from "react";
import { computeSQIWithBreakdown } from "../utils/sqiEngine";

interface Attempt {
  topic: string;
  concept: string;
  importance: string;
  difficulty: string;
  type: string;
  case_based: boolean;
  correct: boolean;
  marks: number;
  neg_marks: number;
  expected_time_sec: number;
  time_spent_sec: number;
  marked_review: boolean;
  revisits: number;
}

interface StudentData {
  student_id: string;
  attempts: Attempt[];
}

export default function Admin() {
  const [prompt, setPrompt] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const [jsonInput, setJsonInput] = useState("");
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [jsonError, setJsonError] = useState("");

  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const savedPrompt = localStorage.getItem("diagnostic_prompt");
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("diagnostic_prompt", prompt);
    setSavedMessage("Prompt saved successfully.");
    setTimeout(() => setSavedMessage(""), 2000);
  };

  const handleLoadJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);

      if (!parsed.student_id || !Array.isArray(parsed.attempts)) {
        throw new Error("Invalid schema");
      }

      setStudentData(parsed);
      setJsonError("");
      setResult(null);
    } catch (err) {
      setJsonError("Invalid JSON format or schema.");
      setStudentData(null);
      setResult(null);
    }
  };

  const handleComputeSQI = () => {
    if (!studentData) return;
    const res = computeSQIWithBreakdown(studentData);
    setResult(res);
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Admin Console</h2>

      {/* Diagnostic Prompt Section */}
      <h3>Diagnostic Agent Prompt</h3>

      <textarea
        rows={8}
        cols={80}
        placeholder="Paste Diagnostic Agent Prompt here..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <br />
      <br />

      <button onClick={handleSave}>Save Prompt</button>

      {savedMessage && <p style={{ color: "green" }}>{savedMessage}</p>}

      <hr style={{ margin: "30px 0" }} />

      {/* Student Attempt Data Section */}
      <h3>Student Attempt Data (JSON)</h3>

      <textarea
        rows={10}
        cols={80}
        placeholder="Paste student attempt JSON here..."
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
      />

      <br />
      <br />

      <button onClick={handleLoadJson}>Load Data</button>

      {jsonError && <p style={{ color: "red" }}>{jsonError}</p>}

      {studentData && (
        <div>
          <h4>Loaded Student:</h4>
          <p>
            <strong>ID:</strong> {studentData.student_id}
          </p>
          <p>
            <strong>Total Attempts:</strong> {studentData.attempts.length}
          </p>
        </div>
      )}

      <hr style={{ margin: "30px 0" }} />

      {/* Compute SQI */}
      <h3>Compute SQI</h3>

      <button onClick={handleComputeSQI} disabled={!studentData}>
        Compute SQI
      </button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <h4>Overall SQI:</h4>
          <p style={{ fontSize: "20px", fontWeight: "bold" }}>
            {result.overall}
          </p>

          <h4>Topic Scores:</h4>
          <ul>
            {result.topicScores.map((t: any, i: number) => (
              <li key={i}>
                {t.topic}: {t.sqi}
              </li>
            ))}
          </ul>

          <h4>Concept Scores:</h4>
          <ul>
            {result.conceptScores.map((c: any, i: number) => (
              <li key={i}>
                {c.topic} - {c.concept}: {c.sqi}
              </li>
            ))}
          </ul>

          <h4>Ranked Concepts for Summary:</h4>
          <ul>
            {result.rankedConcepts.map((r: any, i: number) => (
              <li key={i}>
                <strong>
                  {r.topic} - {r.concept}
                </strong>
                {" | Weight: "} {r.weight}
                {" | Reasons: "} {r.reasons.join(", ")}
              </li>
            ))}
          </ul>

          <hr style={{ margin: "20px 0" }} />

          {/* Final Summary Payload */}
          <h4>Summary Customizer Payload</h4>

          {(() => {
            const payload = {
              student_id: studentData?.student_id,
              overall_sqi: result.overall,
              topic_scores: result.topicScores,
              concept_scores: result.conceptScores,
              ranked_concepts_for_summary: result.rankedConcepts,
              metadata: {
                diagnostic_prompt_version: "v1",
                computed_at: new Date().toISOString(),
                engine: "sqi-v0.1",
              },
            };

            const handleDownload = () => {
              const blob = new Blob([JSON.stringify(payload, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "summary_customizer_input.json";
              a.click();
              URL.revokeObjectURL(url);
            };

            const handleCopy = async () => {
              await navigator.clipboard.writeText(
                JSON.stringify(payload, null, 2),
              );
              alert("JSON copied to clipboard");
            };

            return (
              <div>
                <button onClick={handleDownload}>Download JSON</button>

                <button onClick={handleCopy} style={{ marginLeft: 10 }}>
                  Copy JSON
                </button>

                <pre
                  style={{
                    marginTop: 20,
                    background: "#f4f4f4",
                    padding: 10,
                    maxHeight: 300,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
