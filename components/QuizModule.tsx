import React, { useState, useEffect, ChangeEvent } from 'react';
import { QuizQuestion } from '../types';
import Card from './GlassCard';
import { generateQuiz, parseFileContent } from '../services/geminiService';
import { BrainIcon, UploadIcon } from './icons';

const QuizModule: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizState, setQuizState] = useState<'idle' | 'loading' | 'active' | 'finished'>('idle');
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Moderate' | 'Hard'>('Moderate');
  
  useEffect(() => {
    if (quizState === 'active' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (quizState === 'active' && timeLeft === 0 && questions.length > 0) {
      setQuizState('finished');
    }
  }, [timeLeft, quizState, questions.length]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setIsParsing(true);
      try {
        const text = await parseFileContent(file);
        setFileContent(text);
        setTopic(''); // Clear topic if file is uploaded
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Sorry, I couldn't read that file. Please try a different one.");
        setFileName('');
      } finally {
        setIsParsing(false);
      }
      event.target.value = ''; // Reset file input
    }
  };

  const handleStartQuiz = async () => {
    if (!topic && !fileContent) {
        alert("Please enter a topic or upload a file. The AI can't read your mind... yet.");
        return;
    }
    setQuizState('loading');
    setQuestions([]);
    try {
        const quizTopic = topic || `the uploaded document: ${fileName}`;
        const generatedQuestions = await generateQuiz(quizTopic, 20, difficulty, fileContent ?? undefined, []);
        
        // Shuffle the options for each question to ensure randomness
        const shuffledQuestions = generatedQuestions.map(q => ({
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5)
        }));

        setQuestions(shuffledQuestions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setQuizState('active');
        setTimeLeft(shuffledQuestions.length * 30); // 30 seconds per question
    } catch (error) {
        console.error("Error generating quiz:", error);
        alert("Oops! The AI might be on a coffee break. Please try again.");
        setQuizState('idle');
    }
  };

  const handleGenerateMore = async () => {
    setQuizState('loading');
    const nextDifficulty = difficulty === 'Easy' ? 'Moderate' : 'Hard';
    setDifficulty(nextDifficulty);
    try {
      const quizTopic = topic || `the uploaded document: ${fileName}`;
      const newQuestions = await generateQuiz(quizTopic, 20, nextDifficulty, fileContent ?? undefined, questions);
      if (newQuestions.length > 0) {
        // Shuffle the options for the new questions as well
        const shuffledNewQuestions = newQuestions.map(q => ({
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5)
        }));

        setQuestions(prev => [...prev, ...shuffledNewQuestions]);
        setCurrentQuestionIndex(prev => prev + 1);
        setUserAnswer(null);
        setFeedback('');
        setQuizState('active');
        setTimeLeft(prevTime => prevTime + (shuffledNewQuestions.length * 30));
      } else {
        alert("Couldn't generate more questions. Please try starting a new quiz.");
        setQuizState('finished');
      }
    } catch (error) {
      console.error("Error generating more questions:", error);
      alert("Oops! The AI might be having another coffee break. Please try again.");
      setQuizState('finished');
    }
  };

  const handleAnswer = (option: string) => {
    if (userAnswer) return; // Prevent changing answer
    setUserAnswer(option);
    if (option === questions[currentQuestionIndex].correctAnswer) {
      setScore(s => s + 1);
      setFeedback('Correct! You genius, you.');
    } else {
      setFeedback(`Not quite! The correct answer was: ${questions[currentQuestionIndex].correctAnswer}`);
    }
    
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setUserAnswer(null);
        setFeedback('');
      } else {
        setQuizState('finished');
      }
    }, 2000);
  };

  const resetQuiz = () => {
    setQuizState('idle');
    setTopic('');
    setQuestions([]);
    setFileContent(null);
    setFileName('');
    setDifficulty('Moderate');
  };

  if (quizState === 'idle' || quizState === 'loading') {
    const isLoading = quizState === 'loading' || isParsing;
    return (
      <Card className="flex flex-col items-center justify-center h-full text-center">
        <BrainIcon className="w-16 h-16 text-[var(--primary)] mb-4" />
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-[var(--foreground)]">AI-Powered Quiz</h2>
        <p className="text-[var(--foreground-muted)] mb-6 max-w-md">Enter a topic or upload a document. We'll generate a quiz to test your knowledge.</p>
        
        <div className="flex justify-center gap-2 mb-6">
            {(['Easy', 'Moderate', 'Hard'] as const).map(level => (
                <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-full font-semibold transition disabled:opacity-50 ${difficulty === level ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md' : 'bg-[var(--input-bg)] text-[var(--foreground-muted)] hover:bg-[var(--primary)]/10'}`}
                >
                    {level}
                </button>
            ))}
        </div>

        <div className="w-full max-w-sm space-y-4">
            <input 
              type="text" 
              value={topic}
              onChange={(e) => { setTopic(e.target.value); if(e.target.value) {setFileContent(null); setFileName('');} }}
              placeholder="Enter a topic..."
              className="w-full px-4 py-3 bg-[var(--input-bg)] rounded-lg border border-[var(--input-border)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition text-[var(--foreground)]"
              disabled={isLoading}
            />

            <div className="flex items-center justify-center text-[var(--foreground-muted)] text-sm">
                <span className="flex-grow border-t border-[var(--input-border)]"></span>
                <span className="px-2">OR</span>
                <span className="flex-grow border-t border-[var(--input-border)]"></span>
            </div>

            <label htmlFor="file-upload-quiz" className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)]/5 rounded-lg border border-[var(--input-border)] hover:bg-[var(--primary)]/10 transition text-[var(--foreground-muted)]">
                <UploadIcon className="w-5 h-5" />
                <span className="truncate">{fileName || 'Upload a document'}</span>
            </label>
            <input id="file-upload-quiz" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.csv,.pdf,.docx,.xlsx" disabled={isLoading} />
        </div>
        
        <button 
          onClick={handleStartQuiz}
          disabled={isLoading}
          className="mt-8 px-8 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-lg disabled:bg-opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isLoading ? <><div className="loader !border-[var(--primary-foreground)] !border-b-transparent"></div><span>Generating...</span></> : 'Start Quiz'}
        </button>
      </Card>
    );
  }
  
  if (quizState === 'finished') {
    return (
      <Card className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
        <h2 className="text-3xl font-bold mb-4 text-[var(--foreground)]">Round Complete!</h2>
        <p className="text-xl mb-6 text-[var(--foreground)]/90">Total Score: <span className="font-bold text-[var(--primary)] text-2xl">{score}</span> out of {questions.length}.</p>
        <p className="text-2xl font-semibold text-[var(--foreground)]">
            {(score / questions.length) >= 0.7 ? "Excellent work! Keep the momentum! 🥳" : "Good effort! Ready for another round? 🤓"}
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button onClick={handleGenerateMore} className="px-8 py-3 bg-[var(--accent)] text-[var(--accent-foreground)] font-bold rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-lg">
                Generate 20 More
            </button>
            <button onClick={resetQuiz} className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-lg">
                Start New Quiz
            </button>
        </div>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  return (
    <Card className="h-full flex flex-col p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 text-[var(--foreground)]">
            <span className="font-semibold text-sm sm:text-base">Question {currentQuestionIndex + 1}/{questions.length}</span>
            <span className="font-bold text-lg bg-[var(--primary)]/10 px-3 py-1 rounded-full text-[var(--primary)]">
                ⏰ {Math.floor(timeLeft / 60)}:{('0' + timeLeft % 60).slice(-2)}
            </span>
        </div>
        <div className="w-full bg-[var(--input-border)] rounded-full h-2.5 mb-6">
          <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] h-2.5 rounded-full" style={{ width: `${(((currentQuestionIndex % 20) + 1) / 20) * 100}%`, transition: 'width 0.5s ease' }}></div>
        </div>
        <h3 className="text-xl md:text-2xl font-semibold mb-6 flex-grow text-[var(--foreground)] text-center">{currentQuestion.question}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
                <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={!!userAnswer}
                    className={`p-4 rounded-lg text-left transition-all duration-300 border-2 font-semibold text-base
                    ${!userAnswer ? 'bg-[var(--input-bg)] border-[var(--input-border)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)] text-[var(--foreground)]' : ''}
                    ${userAnswer && option === currentQuestion.correctAnswer ? 'bg-[var(--secondary)] border-[var(--secondary)] text-[var(--secondary-foreground)] ring-2 ring-offset-2 ring-offset-[var(--background)] ring-[var(--secondary)]' : ''}
                    ${userAnswer && option !== currentQuestion.correctAnswer && option === userAnswer ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-foreground)]' : ''}
                    ${userAnswer && option !== currentQuestion.correctAnswer && option !== userAnswer ? 'bg-[var(--input-bg)] border-transparent opacity-60' : ''}
                    `}
                >
                    {option}
                </button>
            ))}
        </div>
        {feedback && <p className="mt-6 text-center font-semibold text-[var(--foreground)]/90 h-6">{feedback}</p>}
    </Card>
  );
};

export default QuizModule;