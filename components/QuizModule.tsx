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
  
  useEffect(() => {
    if (quizState === 'active' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (quizState === 'active' && timeLeft === 0) {
      setQuizState('finished');
    }
  }, [timeLeft, quizState]);

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
        const generatedQuestions = await generateQuiz(quizTopic, 5, fileContent ?? undefined);
        setQuestions(generatedQuestions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setQuizState('active');
        setTimeLeft(generatedQuestions.length * 30); // 30 seconds per question
    } catch (error) {
        console.error("Error generating quiz:", error);
        alert("Oops! The AI might be on a coffee break. Please try again.");
        setQuizState('idle');
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
  };

  if (quizState === 'idle' || quizState === 'loading') {
    const isLoading = quizState === 'loading' || isParsing;
    return (
      <Card className="flex flex-col items-center justify-center h-full text-center">
        <BrainIcon className="w-16 h-16 text-[#134686] mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-[#134686]">AI-Powered Quiz</h2>
        <p className="text-[#134686]/80 mb-6 max-w-md">Enter a topic or upload a document (.pdf, .docx, etc.). We'll generate a quiz to test your knowledge.</p>
        
        <div className="w-full max-w-sm space-y-4">
            <input 
              type="text" 
              value={topic}
              onChange={(e) => { setTopic(e.target.value); if(e.target.value) {setFileContent(null); setFileName('');} }}
              placeholder="Enter a topic..."
              className="w-full px-4 py-3 bg-white/50 rounded-lg border border-[#134686]/20 placeholder:text-[#134686]/60 focus:outline-none focus:ring-2 focus:ring-[#ED3F27] transition text-[#134686]"
              disabled={isLoading}
            />

            <div className="flex items-center justify-center text-[#134686]/60">
                <span className="flex-grow border-t border-[#134686]/20"></span>
                <span className="px-2">OR</span>
                <span className="flex-grow border-t border-[#134686]/20"></span>
            </div>

            <label htmlFor="file-upload-quiz" className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#134686]/5 rounded-lg border border-[#134686]/20 hover:bg-[#134686]/10 transition text-[#134686]/80">
                <UploadIcon className="w-5 h-5" />
                <span className="truncate">{fileName || 'Upload a document'}</span>
            </label>
            <input id="file-upload-quiz" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.csv,.pdf,.docx,.xlsx" disabled={isLoading} />
        </div>
        
        <button 
          onClick={handleStartQuiz}
          disabled={isLoading}
          className="mt-6 px-8 py-3 bg-[#134686] text-[#D9E9CF] font-bold rounded-lg hover:bg-[#134686]/90 transition-transform transform hover:scale-105 shadow-lg disabled:bg-[#134686]/60 disabled:cursor-not-allowed"
        >
          {quizState === 'loading' ? 'Generating Brain Busters...' : isParsing ? 'Reading your document...' : 'Start Quiz'}
        </button>
      </Card>
    );
  }
  
  if (quizState === 'finished') {
    return (
      <Card className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-3xl font-bold mb-4 text-[#134686]">Quiz Complete!</h2>
        <p className="text-xl mb-6 text-[#134686]/90">You scored {score} out of {questions.length}.</p>
        <p className="text-2xl font-semibold text-[#134686]">
            {score/questions.length > 0.7 ? "Excellent work! 🥳" : "Good effort! Keep studying! 🤓"}
        </p>
        <button onClick={resetQuiz} className="mt-8 px-8 py-3 bg-[#134686] text-[#D9E9CF] font-bold rounded-lg hover:bg-[#134686]/90 transition-transform transform hover:scale-105 shadow-lg">
          Take Another Quiz
        </button>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  return (
    <Card className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4 text-[#134686]">
            <span className="font-semibold">Question {currentQuestionIndex + 1}/{questions.length}</span>
            <span className="font-bold text-lg bg-[#134686]/10 px-3 py-1 rounded-full">
                ⏰ {Math.floor(timeLeft / 60)}:{('0' + timeLeft % 60).slice(-2)}
            </span>
        </div>
        <div className="w-full bg-[#134686]/20 rounded-full h-2.5 mb-6">
          <div className="bg-[#134686] h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`, transition: 'width 0.3s' }}></div>
        </div>
        <h3 className="text-xl font-semibold mb-6 flex-grow text-[#134686]">{currentQuestion.question}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
                <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={!!userAnswer}
                    className={`p-4 rounded-lg text-left transition-all duration-300 border
                    ${!userAnswer ? 'bg-white/50 border-[#134686]/20 hover:bg-white/80 hover:border-[#134686]/30 text-[#134686]' : ''}
                    ${userAnswer && option === currentQuestion.correctAnswer ? 'bg-[#FEB21A] border-[#FEB21A] text-[#134686]' : ''}
                    ${userAnswer && option !== currentQuestion.correctAnswer && option === userAnswer ? 'bg-[#ED3F27] border-[#ED3F27] text-white' : ''}
                    ${userAnswer && option !== currentQuestion.correctAnswer && option !== userAnswer ? 'bg-white/30 border-[#134686]/10 opacity-50' : ''}
                    `}
                >
                    {option}
                </button>
            ))}
        </div>
        {feedback && <p className="mt-4 text-center font-semibold text-[#134686]/90">{feedback}</p>}
    </Card>
  );
};

export default QuizModule;