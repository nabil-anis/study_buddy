
import React, { useState, useEffect, ChangeEvent } from 'react';
import { QuizQuestion, UserProfile } from '../types';
import Card from './GlassCard';
import { generateQuiz, parseFileContent } from '../services/geminiService';
import { BrainIcon, UploadIcon } from './icons';
import { supabase } from '../services/supabaseClient';

interface QuizModuleProps {
  userProfile: UserProfile;
}

const QuizModule: React.FC<QuizModuleProps> = ({ userProfile }) => {
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
      handleFinishQuiz();
    }
  }, [timeLeft, quizState, questions.length]);

  const handleFinishQuiz = async (finalScore?: number) => {
    const s = finalScore !== undefined ? finalScore : score;
    setQuizState('finished');
    
    // Save to Supabase
    if (supabase && userProfile.id) {
        await supabase.from('quizzes').insert([{
            user_id: userProfile.id,
            topic: topic || fileName || 'Unknown Topic',
            score: s,
            total_questions: questions.length,
            difficulty: difficulty
        }]);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setIsParsing(true);
      try {
        const text = await parseFileContent(file);
        setFileContent(text);
        setTopic(''); 
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Sorry, I couldn't read that file.");
        setFileName('');
      } finally {
        setIsParsing(false);
      }
      event.target.value = '';
    }
  };

  const handleStartQuiz = async () => {
    if (!topic && !fileContent) {
        alert("Please enter a topic or upload a file.");
        return;
    }
    setQuizState('loading');
    setQuestions([]);
    try {
        const quizTopic = topic || `the uploaded document: ${fileName}`;
        const generatedQuestions = await generateQuiz(quizTopic, 10, difficulty, fileContent ?? undefined, []);
        
        const shuffledQuestions = generatedQuestions.map(q => ({
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5)
        }));

        setQuestions(shuffledQuestions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setQuizState('active');
        setTimeLeft(shuffledQuestions.length * 30);
    } catch (error) {
        console.error("Error generating quiz:", error);
        setQuizState('idle');
    }
  };

  const handleAnswer = (option: string) => {
    if (userAnswer) return; 
    setUserAnswer(option);
    let newScore = score;
    if (option === questions[currentQuestionIndex].correctAnswer) {
      newScore = score + 1;
      setScore(newScore);
      setFeedback('Correct!');
    } else {
      setFeedback(`Wrong! Correct: ${questions[currentQuestionIndex].correctAnswer}`);
    }
    
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setUserAnswer(null);
        setFeedback('');
      } else {
        handleFinishQuiz(newScore);
      }
    }, 1500);
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
        <BrainIcon className="w-16 h-16 text-[var(--primary)] mb-4" />
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-[var(--foreground)]">AI Quiz</h2>
        <p className="text-[var(--foreground-muted)] mb-6 max-w-md">Test yourself on any topic. Results are saved to your profile.</p>
        
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
              placeholder="Topic (e.g. Ancient Rome)"
              className="w-full px-4 py-3 bg-[var(--input-bg)] rounded-lg border border-[var(--input-border)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition text-[var(--foreground)]"
              disabled={isLoading}
            />

            <label htmlFor="file-upload-quiz" className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)]/5 rounded-lg border border-[var(--input-border)] hover:bg-[var(--primary)]/10 transition text-[var(--foreground-muted)]">
                <UploadIcon className="w-5 h-5" />
                <span className="truncate">{fileName || 'Upload Document'}</span>
            </label>
            <input id="file-upload-quiz" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.pdf,.docx" disabled={isLoading} />
        </div>
        
        <button 
          onClick={handleStartQuiz}
          disabled={isLoading}
          className="mt-8 px-8 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-lg disabled:bg-opacity-60 flex items-center justify-center gap-3"
        >
          {isLoading ? <div className="loader !border-white"></div> : 'Start'}
        </button>
      </Card>
    );
  }
  
  if (quizState === 'finished') {
    return (
      <Card className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
        <h2 className="text-3xl font-bold mb-4">Quiz Saved!</h2>
        <p className="text-xl mb-6">You scored <span className="font-bold text-[var(--primary)]">{score}</span> / {questions.length}</p>
        <button onClick={resetQuiz} className="px-6 py-3 bg-[var(--primary)] text-white font-bold rounded-lg hover:scale-105 transition">
            Take Another Quiz
        </button>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  return (
    <Card className="h-full flex flex-col p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
            <span className="font-semibold">Question {currentQuestionIndex + 1}/{questions.length}</span>
            <span className="font-bold text-[var(--primary)]">Time: {timeLeft}s</span>
        </div>
        <h3 className="text-xl md:text-2xl font-semibold mb-6 flex-grow text-center">{currentQuestion.question}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
                <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={!!userAnswer}
                    className={`p-4 rounded-lg text-left transition-all border-2 font-semibold
                    ${!userAnswer ? 'bg-[var(--input-bg)] border-[var(--input-border)] hover:border-[var(--primary)]' : ''}
                    ${userAnswer && option === currentQuestion.correctAnswer ? 'bg-green-500 text-white border-green-500' : ''}
                    ${userAnswer && option !== currentQuestion.correctAnswer && option === userAnswer ? 'bg-red-500 text-white border-red-500' : ''}
                    ${userAnswer && option !== currentQuestion.correctAnswer && option !== userAnswer ? 'opacity-50' : ''}
                    `}
                >
                    {option}
                </button>
            ))}
        </div>
        {feedback && <p className="mt-6 text-center font-bold text-lg">{feedback}</p>}
    </Card>
  );
};

export default QuizModule;
