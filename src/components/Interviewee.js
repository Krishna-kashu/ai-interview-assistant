import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCandidate,
  updateCandidate,
  saveCurrentProgress,
  completeCandidate,
} from "../redux/store";
import { parseResume } from "../utils/resumeParser";
import { generateQuestions, scoreAnswer, finalizeCandidate } from "../api/aiApi";
import {
  Button,
  Upload,
  Input,
  Modal,
  Progress,
  Typography,
  message,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";

const { Dragger } = Upload;
const { Title, Text } = Typography;

export default function Interviewee() {
  const dispatch = useDispatch();
  const currentCandidate = useSelector(
    (state) => state.candidates.currentCandidate
  );

  const intervalRef = useRef(null);
  const [step, setStep] = useState(0);
  const [candidate, setCandidate] = useState({
    id: null,
    name: "",
    email: "",
    phone: "",
    answers: [],
    questions: [],
    summary: "",
  });
  const [timer, setTimer] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Debug: log state
  console.log("Current Candidate from Redux:", currentCandidate);
  console.log("Local Candidate state:", candidate, "Step:", step);

  // Resume previous session
  useEffect(() => {
  if (currentCandidate && !currentCandidate.completed) {
    setCandidate(currentCandidate);
    const answers = Array.isArray(currentCandidate.answers) ? currentCandidate.answers : [];
    setCurrentQIndex(answers.length);
    setStep(answers.length > 0 ? 2 : 0);
    if (answers.length > 0) setShowModal(true);
  }
}, [currentCandidate]);


  // Fetch AI questions
  const fetchQuestions = async () => {
    try {
      console.log("Fetching questions from AI API...");
      const questions = await generateQuestions();
      const safeQuestions = Array.isArray(questions) ? questions : [];
      if (safeQuestions.length === 0) {
        message.error("No questions returned from AI API");
        console.warn("AI API returned no questions");
        return;
      }
      const updatedCandidate = { ...candidate, questions: safeQuestions };
      setCandidate(updatedCandidate);
      dispatch(updateCandidate(updatedCandidate));
      setStep(2);
      setTimer(safeQuestions[0].time || 60);
      console.log("Questions fetched:", safeQuestions);
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      message.error("Failed to generate questions");
    }
  };

  // Submit answer
  const handleNext = useCallback(async () => {
    const questions = Array.isArray(candidate.questions) ? candidate.questions : [];
    const answers = Array.isArray(candidate.answers) ? candidate.answers : [];

    if (!answer.trim()) {
      message.warning("Please enter an answer or it will be counted as empty.");
    }

    const currentQuestion = questions[currentQIndex] || {};
    const updatedCandidate = {
      ...candidate,
      answers: [...answers, { ...currentQuestion, answer }],
    };
    setCandidate(updatedCandidate);
    setAnswer("");

    console.log("Submitting answer for question:", currentQuestion.question);

    // Call AI scoring
    try {
      const result = await scoreAnswer(
        candidate.id || Date.now(),
        currentQuestion.question || "",
        answer
      );
      updatedCandidate.answers[currentQIndex].score = result.score;
      console.log("Score received:", result.score);
    } catch {
      updatedCandidate.answers[currentQIndex].score = 0;
      console.warn("Scoring failed, score set to 0");
    }

    dispatch(updateCandidate(updatedCandidate));
    dispatch(saveCurrentProgress(updatedCandidate));

    const isLast = currentQIndex === questions.length - 1;
    if (isLast) {
      try {
        const summaryRes = await finalizeCandidate(candidate.id);
        updatedCandidate.summary = summaryRes.summary || "";
        dispatch(completeCandidate(updatedCandidate));
        setCandidate(updatedCandidate);
        setStep(3);
        message.success("Interview Completed!");
        console.log("Interview completed, summary:", updatedCandidate.summary);
      } catch {
        message.error("Failed to generate summary");
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      setCurrentQIndex(currentQIndex + 1);
      setTimer(questions[currentQIndex + 1]?.time || 60);
    }
  }, [candidate, currentQIndex, answer, dispatch]);

  // Timer per question
  useEffect(() => {
    const questions = Array.isArray(candidate.questions) ? candidate.questions : [];
    if (step !== 2 || questions.length === 0 || currentQIndex >= questions.length) return;

    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          handleNext().catch(console.error);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [step, candidate.questions, currentQIndex, handleNext]);

  // Fill missing fields
  const handleFillMissing = async () => {
    if (!candidate.name || !candidate.email || !candidate.phone) {
      message.error("Please fill all missing fields");
      return;
    }
    await fetchQuestions();
  };


const handleFinish = async () => {
  try {
    const summaryRes = await finalizeCandidate(candidate.id);
    const updatedCandidate = {
      ...candidate,
      summary: summaryRes.summary || "",
      completed: true,
    };
    dispatch(completeCandidate(updatedCandidate));
    setCandidate(updatedCandidate);
    setStep(3); // Step 3: show completed summary
    message.success("Interview Completed!");
    if (intervalRef.current) clearInterval(intervalRef.current);
  } catch (err) {
    console.error(err);
    message.error("Failed to finalize interview");
  }
};


  const questions = Array.isArray(candidate.questions) ? candidate.questions : [];
  const currentQuestion = questions[currentQIndex] || { question: "", level: "" };
  const answers = Array.isArray(candidate.answers) ? candidate.answers : [];


  return (
    <div style={{ padding: "20px" }}>
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

      {/* Resume Upload */}
      {(!candidate || step === 0) && (
        <>
          <Title level={3}>Upload Resume</Title>
          <Dragger
            name="file"
            accept=".pdf,.docx"
            multiple={false}
            beforeUpload={async (file) => {
  console.log("File uploaded:", file.name);
  const parsed = await parseResume(file);
  const newCandidate = {
    name: parsed.name || file.name.split(".")[0],
    email: parsed.email || "",
    phone: parsed.phone || "",
    id: Date.now(),
    answers: [],
    questions: [],
  };
  setCandidate(newCandidate);
  dispatch(addCandidate(newCandidate));
  dispatch(saveCurrentProgress(newCandidate));
  console.log("New candidate created:", newCandidate);

  // Fetch questions immediately
  await fetchQuestions();

  // If missing fields, go to step 1
  if (!newCandidate.name || !newCandidate.email || !newCandidate.phone) {
    setStep(1);
  } else {
    setStep(2); // All fields present, go to questions
  }

  return false;
}}

          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p>Click or drag file to upload (PDF/DOCX)</p>
          </Dragger>
        </>
      )}

      {/* Fill Missing Details */}
      {step === 1 && (
        <>
          <Title level={3}>Fill Missing Details</Title>

          <label htmlFor="candidate-name">Name</label>
          <Input
            id="candidate-name"
            name="name"
            placeholder="Name"
            value={candidate.name}
            onChange={(e) =>
              setCandidate({ ...candidate, name: e.target.value })
            }
            style={{ marginBottom: "10px" }}
          />

          <label htmlFor="candidate-email">Email</label>
          <Input
            id="candidate-email"
            name="email"
            placeholder="Email"
            value={candidate.email}
            onChange={(e) =>
              setCandidate({ ...candidate, email: e.target.value })
            }
            style={{ marginBottom: "10px" }}
          />

          <label htmlFor="candidate-phone">Phone</label>
          <Input
            id="candidate-phone"
            name="phone"
            placeholder="Phone"
            value={candidate.phone}
            onChange={(e) =>
              setCandidate({ ...candidate, phone: e.target.value })
            }
            style={{ marginBottom: "10px" }}
          />

          <Button
            type="primary"
            onClick={handleFillMissing}
            style={{ marginTop: "10px" }}
          >
            Start Interview
          </Button>
        </>
      )}

      {/* Step 2: Questions */}
        {step === 2 && (
  <>
    {candidate.questions?.length > 0 || candidate.answers?.length > 0 ? (
      currentQIndex < (candidate.questions?.length || candidate.answers?.length) ? (
        // Show current question
        <div>
          <Title level={4}>
            Question ({currentQuestion.level} - {timer}s left)
          </Title>
          <Text>{currentQuestion.question}</Text>
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
            percent={
              ((currentQIndex + 1) / (candidate.questions?.length || candidate.answers?.length)) * 100
            }
            style={{ marginTop: "10px" }}
          />
          {console.log("Rendering question", currentQIndex)}
        </div>
      ) : (

        <div>
        <Title level={4}>All questions answered!</Title>
        <Text>You have answered all questions. Click below to finalize your interview.</Text>
        <Button type="primary" onClick={handleFinish} style={{ marginTop: "10px" }}>
          Finish Interview
        </Button>
        {console.log("Step 2: all questions completed")}
      </div>
      )
    ) : (
      <div>
        <Title level={4}>No questions available!</Title>
        <Text>Please upload your resume to start the interview.</Text>
      </div>
    )}
  </>
)}


      {/* Interview Completed */}
      {step === 3 && (
        <>
          <Title level={3}>Interview Completed!</Title>
          <p><strong>Name:</strong> {candidate.name}</p>
          <p><strong>Email:</strong> {candidate.email}</p>
          <p><strong>Phone:</strong> {candidate.phone}</p>
          <p><strong>Summary:</strong> {candidate.summary}</p>
          <p>
            <strong>Score:</strong>{" "}
            {answers.reduce((acc, a) => acc + (a.score || 0), 0)}
          </p>
              <Button type="primary" onClick={() => setStep(0)} style={{ marginTop: "20px" }}>
                Upload New Resume
              </Button>
        </>
      )}

      
    </div>
  );
}
