import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Divider,
  Alert,
  IconButton,
  LinearProgress,
  TextField,
  MenuItem,
  Card,
  CardContent,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  NavigateNext as NavigateNextIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI } from '../services/api';
import QuizResultScreen from '../components/quiz/QuizResultScreen';

const QuizGenerator = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  // States
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [rewardsData, setRewardsData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const fileInputRef = useRef(null);

  const steps = ['Upload Material', 'Configure Quiz', 'Interactive Quiz', 'Results'];

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      if (allowedTypes.includes(ext)) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Unsupported file format. Please upload PDF, Word, or Text files.');
        setFile(null);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange({ target: { files: [droppedFile] } });
    }
  };

  // Generate Quiz API call
  const generateQuiz = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('difficulty', difficulty);
    formData.append('numQuestions', numQuestions.toString());

    try {
      const response = await axios.post('/api/quiz/generate_from_file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.status === 'success') {
        setQuizData(response.data.quiz_data);
        setActiveStep(2); // Move to Quiz step
        setStartTime(Date.now());
      }
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError(err.response?.data?.detail || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: answerIndex,
    });
  };

  const handleShortAnswerChange = (questionId, text) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: text,
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitResults();
    }
  };

  const submitResults = async () => {
    setIsSubmitting(true);
    setError(null);

    const score = calculateScore();
    const timeTaken = (Date.now() - startTime) / 1000; // in seconds

    const resultData = {
      student_id: studentId,
      score_pct: Math.round((score / quizData.length) * 100),
      time_taken: timeTaken,
      num_questions: quizData.length,
      subject: file?.name || 'General',
      difficulty: difficulty
    };

    try {
      const response = await studentAPI.submitQuizResult(resultData);
      if (response.data.status === 'success') {
        setRewardsData(response.data);
        setIsQuizCompleted(true);
        setActiveStep(3);
      }
    } catch (err) {
      console.error('Error submitting quiz result:', err);
      setError('Failed to save your progress. You can still see your score below.');
      setIsQuizCompleted(true);
      setActiveStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    quizData.forEach((q) => {
      if (q.type === 'mcq' || q.type === 'true_false') {
        if (userAnswers[q.id] === q.correctIndex) {
          score++;
        }
      } else if (q.type === 'short_answer') {
        // Simple comparison or just count as seen
        score++; // Give credit for attempting short answers in this simple version
      }
    });
    return score;
  };

  const restartQuiz = () => {
    setActiveStep(0);
    setFile(null);
    setQuizData([]);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setIsQuizCompleted(false);
    setError(null);
  };

  // --- UI Render Components ---

  const renderUploadStep = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Upload Your Study Material
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
          Upload a PDF, Word document, or Text file to generate a customized AI quiz.
        </Typography>

        <Paper
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{
            p: 5,
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderColor: 'primary.main',
            },
          }}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            type="file"
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
          />
          <CloudUploadIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
          <Typography variant="h6">
            {file ? file.name : 'Drag and drop or click to upload'}
          </Typography>
          {file && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
          )}
        </Paper>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            disabled={!file}
            onClick={() => setActiveStep(1)}
            endIcon={<ArrowForwardIcon />}
            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
          >
            Continue
          </Button>
        </Box>
      </Box>
    </motion.div>
  );

  const renderConfigStep = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Box sx={{ p: 4, maxWidth: 500, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          Configure Your Quiz
        </Typography>

        <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 3 }}>
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Difficulty Level
              </Typography>
              <TextField
                select
                fullWidth
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                variant="outlined"
              >
                <MenuItem value="Easy">Easy (Conceptual basics)</MenuItem>
                <MenuItem value="Medium">Medium (Balanced)</MenuItem>
                <MenuItem value="Hard">Hard (Deep analysis)</MenuItem>
              </TextField>
            </Box>

            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Number of Questions
              </Typography>
              <TextField
                select
                fullWidth
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
                variant="outlined"
              >
                {[5, 10, 15].map((val) => (
                  <MenuItem key={val} value={val}>{val} Questions</MenuItem>
                ))}
              </TextField>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mt: 6, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => setActiveStep(0)} startIcon={<ArrowBackIcon />}>
            Back
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={generateQuiz}
            disabled={loading}
            endIcon={loading ? <CircularProgress size={20} /> : <SchoolIcon />}
            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
          >
            {loading ? 'Generating...' : 'Start Quiz'}
          </Button>
        </Box>

        {loading && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" sx={{ mb: 1, textAlign: 'center' }}>
              Our AI is reading your material and crafting questions...
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress > 0 ? uploadProgress : undefined} />
          </Box>
        )}
      </Box>
    </motion.div>
  );

  const renderQuizStep = () => {
    const question = quizData[currentQuestionIndex];
    if (!question) return null;

    const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;

    return (
      <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Question {currentQuestionIndex + 1} of {quizData.length}
            </Typography>
            <Typography variant="subtitle2" color="primary">
              {Math.round(progress)}% Complete
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
        </Box>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{ p: 4, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.03)', boxShadow: 10 }}>
              <Typography variant="h6" sx={{ mb: 4, lineHeight: 1.6 }}>
                {question.question}
              </Typography>

              {question.type === 'mcq' || question.type === 'true_false' ? (
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <RadioGroup
                    value={userAnswers[question.id] ?? ''}
                    onChange={(e) => handleAnswerSelect(question.id, parseInt(e.target.value))}
                  >
                    {question.options.map((option, idx) => (
                      <Paper
                        key={idx}
                        sx={{
                          mb: 2,
                          p: 1,
                          backgroundColor: userAnswers[question.id] === idx ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
                          border: '1px solid',
                          borderColor: userAnswers[question.id] === idx ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          },
                        }}
                      >
                        <FormControlLabel
                          value={idx}
                          control={<Radio color="primary" />}
                          label={option}
                          sx={{ width: '100%', m: 0, py: 1 }}
                        />
                      </Paper>
                    ))}
                  </RadioGroup>
                </FormControl>
              ) : (
                <Box>
                  <TextField
                    fullWidth
                    label="Type your answer here..."
                    multiline
                    rows={4}
                    variant="outlined"
                    value={userAnswers[question.id] || ''}
                    onChange={(e) => handleShortAnswerChange(question.id, e.target.value)}
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  />
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    Note: Short answers are for your practice. They will be marked as correct if attempted.
                  </Typography>
                </Box>
              )}
            </Paper>
          </motion.div>
        </AnimatePresence>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            size="large"
            disabled={currentQuestionIndex === 0}
            onClick={prevQuestion}
            startIcon={<ArrowBackIcon />}
          >
            Previous
          </Button>
          <Button
            variant="contained"
            size="large"
            disabled={userAnswers[question.id] === undefined && question.type !== 'short_answer'}
            onClick={nextQuestion}
            endIcon={currentQuestionIndex === quizData.length - 1 ? <CheckCircleIcon /> : <NavigateNextIcon />}
            sx={{ px: 4, borderRadius: 2 }}
          >
            {currentQuestionIndex === quizData.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </Button>
        </Box>
      </Box>
    );
  };

  const renderResultsStep = () => {
    if (isSubmitting) {
      return (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <CircularProgress size={60} sx={{ mb: 4 }} />
          <Typography variant="h5">Calculating Your Rewards...</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Our AI is analyzing your performance...
          </Typography>
        </Box>
      );
    }

    if (rewardsData) {
      return (
        <QuizResultScreen 
          results={rewardsData}
          onRestart={restartQuiz}
          onGoHome={() => navigate(`/dashboard-modern/${studentId}`)}
          score={calculateScore()}
          totalQuestions={quizData.length}
          difficulty={difficulty}
          quizData={quizData}
          userAnswers={userAnswers}
        />
      );
    }

    const score = calculateScore();
    const percentage = Math.round((score / quizData.length) * 100);

    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 5, backgroundColor: 'rgba(255, 255, 255, 0.05)', mb: 4 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 800 }}>
              {percentage}%
            </Typography>
            <Typography variant="h5" color="textSecondary" gutterBottom>
              Your Score: {score} / {quizData.length}
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, mb: 4, fontStyle: 'italic' }}>
              {percentage >= 80 ? 'Excellent work! You have mastered this material.' : 
               percentage >= 50 ? 'Good effort! A little more review will help you master these concepts.' : 
               'Keep studying! Review the explanations below to improve your understanding.'}
            </Typography>
            <Button variant="contained" size="large" onClick={restartQuiz} startIcon={<RefreshIcon />}>
              Try Another Topic
            </Button>
          </Paper>

          <Typography variant="h6" gutterBottom sx={{ mt: 6, mb: 3 }}>
            Review Questions
          </Typography>

          {quizData.map((q, idx) => {
            const isCorrect = q.type === 'short_answer' ? true : userAnswers[q.id] === q.correctIndex;
            
            return (
              <Accordion key={q.id} sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    {isCorrect ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Question {idx + 1}: {q.question}
                    </Typography>
                  </Box>

                  {q.type !== 'short_answer' && (
                    <Box sx={{ ml: 5, mb: 2 }}>
                      <Typography variant="body2" color={isCorrect ? 'success.main' : 'error.main'}>
                        Your Answer: {q.options[userAnswers[q.id]] || 'Not answered'}
                      </Typography>
                      {!isCorrect && (
                        <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                          Correct Answer: {q.options[q.correctIndex]}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {q.type === 'short_answer' && (
                    <Box sx={{ ml: 5, mb: 2 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                        Your Input: {userAnswers[q.id] || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                        Expected: {q.correctAnswer}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ ml: 5, p: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Educational Insight:
                    </Typography>
                    <Typography variant="body2">
                      {q.explanation}
                    </Typography>
                  </Box>
                </Box>
              </Accordion>
            );
          })}
        </Box>
      </motion.div>
    );
  };

  const Accordion = ({ children, sx }) => (
    <Paper sx={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden', ...sx }}>
      {children}
    </Paper>
  );

  return (
    <Box sx={{ minHeight: '100vh', py: 4, px: 2 }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6, '& .MuiStepLabel-label': { mt: 1 } }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {activeStep === 0 && renderUploadStep()}
        {activeStep === 1 && renderConfigStep()}
        {activeStep === 2 && renderQuizStep()}
        {activeStep === 3 && renderResultsStep()}
      </Box>
    </Box>
  );
};

export default QuizGenerator;
