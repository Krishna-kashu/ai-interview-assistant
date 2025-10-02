import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCandidate,
  updateCandidate,
  saveCurrentProgress,
  completeCandidate,
} from "../redux/store";
import { parseResume } from "../utils/resumeParser";
import { Button, Upload, Input, Modal, Progress, Typography, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";

const { Dragger } = Upload;
const { Title, Text } = Typography;

const questions = [
  { level: "Easy", time: 20, question: "What is React?" },
  { level: "Easy", time: 20, question: "Explain useState hook." },
  { level: "Medium", time: 60, question: "Describe Redux and its benefits." },
  { level: "Medium", time: 60, question: "Explain React lifecycle methods." },
  { level: "Hard", time: 120, question: "How would you optimize React performance?" },
  { level: "Hard", time: 120, question: "Explain context API vs Redux." },
];

// Simple scoring function: 10 points for each non-empty answer
const calculateScore = (answers) =>
  answers.reduce((total, ans) => total + (ans.answer.trim() ? 10 : 0), 0);

export default function Interviewee() {
  const dispatch = useDispatch();
  const currentCandidate = useSelector((state) => state.candidates.currentCandidate);

  const intervalRef = useRef(null);
  const [step, setStep] = useState(0); // 0: Upload, 1: Fill Missing, 2: Interview, 3: Completed
  const [candidate, setCandidate] = useState({ name: "", email: "", phone: "", answers: [] });
  const [timer, setTimer] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    console.log(msg);
    setLogs((prev) => [msg, ...prev]);
  };

  // Resume previous session
  useEffect(() => {
    if (currentCandidate && !currentCandidate.completed) {
      addLog("Resuming previous candidate: " + JSON.stringify(currentCandidate));
      setCandidate(currentCandidate);
      setCurrentQIndex(currentCandidate.answers.length || 0);
      setStep(2);
      setShowModal(true);
    } else if (currentCandidate && currentCandidate.completed) {
      setCandidate(currentCandidate);
      setStep(3);
    }
  }, [currentCandidate]);

  // Handle answer submission
  const handleNext = useCallback(() => {
    if (!candidate.name || !candidate.email || !candidate.phone) {
      message.error("Cannot continue: missing candidate info.");
      addLog("Candidate incomplete, cannot submit answer");
      return;
    }

    const candidateId = candidate.id || Date.now();
    const isLastQuestion = currentQIndex === questions.length - 1;

    const updatedCandidate = {
      ...candidate,
      id: candidateId,
      answers: [
        ...candidate.answers,
        { question: questions[currentQIndex].question, answer },
      ],
      completed: isLastQuestion,
    };

    addLog("Submitting answer: " + JSON.stringify(updatedCandidate));
    setCandidate(updatedCandidate);
    setAnswer("");

    if (!candidate.id) dispatch(addCandidate(updatedCandidate));
    else dispatch(updateCandidate(updatedCandidate));

    dispatch(saveCurrentProgress(updatedCandidate));

    if (isLastQuestion) {
      const finalScore = calculateScore(updatedCandidate.answers);
      dispatch(completeCandidate({ ...updatedCandidate, score: finalScore }));
      message.success("Interview Completed! Score: " + finalScore);
      setStep(3);
      addLog(
        "Interview completed for candidate ID " +
          updatedCandidate.id +
          " | Score: " +
          finalScore
      );
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      setCurrentQIndex(currentQIndex + 1);
    }
  }, [candidate, currentQIndex, answer, dispatch]);

  // Timer per question
  useEffect(() => {
    if (step === 2 && currentQIndex < questions.length) {
      setTimer(questions[currentQIndex].time);
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            handleNext();
            return 0;
          }
          return t - 1;
        });
      }, 1000);

      return () => clearInterval(intervalRef.current);
    }
  }, [step, currentQIndex, handleNext]);

  // Fill missing fields
  const handleFillMissing = () => {
    if (!candidate.name || !candidate.email || !candidate.phone) {
      message.error("Please fill all missing fields");
      addLog("Fill missing fields error: candidate incomplete");
      return;
    }
    const updatedCandidate = { ...candidate };
    dispatch(saveCurrentProgress(updatedCandidate));
    setCandidate(updatedCandidate);
    setStep(2);
    addLog("All missing fields filled, starting interview");
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Welcome Back Modal */}
      {showModal && step === 2 && (
        <Modal
          open={showModal}
          onOk={() => setShowModal(false)}
          onCancel={() => setShowModal(false)}
          title="Welcome Back"
        >
          You have an unfinished interview. Resuming...
        </Modal>
      )}

      {/* Step 0: Upload Resume */}
      {step === 0 && (
        <>
          <Title level={3}>Upload your Resume</Title>
          <Dragger
            name="file"
            accept=".pdf,.docx"
            multiple={false}
            beforeUpload={async (file) => {
              try {
                const parsed = await parseResume(file);

                // Fallback if name is missing
                const name = parsed.name || file.name.split(".")[0];
                const newCandidate = {
                  name,
                  email: parsed.email || "",
                  phone: parsed.phone || "",
                  id: Date.now(),
                  answers: [],
                };

                addLog("Parsed resume: " + JSON.stringify(newCandidate));

                setCandidate(newCandidate);
                dispatch(addCandidate(newCandidate));
                dispatch(saveCurrentProgress(newCandidate));

                if (!newCandidate.name || !newCandidate.email || !newCandidate.phone) {
                  setStep(1);
                  addLog("Missing fields detected, moving to step 1");
                } else {
                  setStep(2);
                  addLog("All fields present, moving to step 2");
                }

                message.success(
                  `Resume uploaded! Name: ${newCandidate.name}, Email: ${newCandidate.email ||
                    "N/A"}, Phone: ${newCandidate.phone || "N/A"}`
                );
              } catch (e) {
                addLog("Error parsing resume: " + e.message);
                message.error("Error parsing resume: " + e.message);
              }
              return false; // prevent auto upload
            }}
            onRemove={() => {
              setCandidate({ name: "", email: "", phone: "", answers: [] });
              setStep(0);
              addLog("Candidate reset due to resume removal");
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p>Click or drag file to upload (PDF/DOCX)</p>
          </Dragger>

          {(candidate.name || candidate.email || candidate.phone) && (
            <div style={{ marginTop: "10px" }}>
              <strong>Uploaded Resume Info:</strong>
              <div>Name: {candidate.name}</div>
              <div>Email: {candidate.email || "N/A"}</div>
              <div>Phone: {candidate.phone || "N/A"}</div>
            </div>
          )}
        </>
      )}

      {/* Step 1: Fill Missing */}
      {step === 1 && (
        <>
          <Title level={3}>Fill Missing Details</Title>
          {!candidate.name && (
            <Input
              placeholder="Name"
              value={candidate.name}
              onChange={(e) => setCandidate({ ...candidate, name: e.target.value })}
              style={{ marginBottom: "10px" }}
            />
          )}
          {!candidate.email && (
            <Input
              placeholder="Email"
              value={candidate.email}
              onChange={(e) => setCandidate({ ...candidate, email: e.target.value })}
              style={{ marginBottom: "10px" }}
            />
          )}
          {!candidate.phone && (
            <Input
              placeholder="Phone"
              value={candidate.phone}
              onChange={(e) => setCandidate({ ...candidate, phone: e.target.value })}
            />
          )}
          <Button type="primary" onClick={handleFillMissing} style={{ marginTop: "10px" }}>
            Start Interview
          </Button>
        </>
      )}

      {/* Step 2: Interview */}
      {step === 2 && currentQIndex < questions.length && (
        <>
          <Title level={4}>
            Question ({questions[currentQIndex].level} - {timer}s left)
          </Title>
          <Text>{questions[currentQIndex].question}</Text>
          <Input.TextArea
            rows={4}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            style={{ marginTop: "10px" }}
          />
          <Button type="primary" onClick={handleNext} style={{ marginTop: "10px" }}>
            Submit Answer
          </Button>
          <Progress
            percent={((currentQIndex + 1) / questions.length) * 100}
            style={{ marginTop: "10px" }}
          />
        </>
      )}

      {/* Step 3: Completed */}
      {step === 3 && (
        <div>
          <Title level={3}>Interview Completed!</Title>
          <p>Thank you for completing the interview.</p>
          <p>
            <strong>Name:</strong> {candidate.name}
          </p>
          <p>
            <strong>Email:</strong> {candidate.email || "N/A"}
          </p>
          <p>
            <strong>Phone:</strong> {candidate.phone || "N/A"}
          </p>
          <p>
            <strong>Score:</strong> {candidate.score || calculateScore(candidate.answers)}
          </p>
        </div>
      )}

      {/* Logs */}
      <div
        style={{
          marginTop: "30px",
          maxHeight: "200px",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: "10px",
          background: "#f7f7f7",
        }}
      >
        <strong>Logs:</strong>
        {logs.map((log, index) => (
          <div key={index} style={{ fontSize: "12px", marginBottom: "4px" }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
