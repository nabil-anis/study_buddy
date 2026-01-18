
import React, { useState, useEffect, ChangeEvent } from 'react';
import { QuizQuestion, UserProfile } from '../types';
import Card from './GlassCard';
import { generateQuiz, parseFileContent } from '../services/geminiService';
import { BrainIcon, UploadIcon, ChevronLeftIcon } from './icons';
import { supabase } from '../services/supabaseClient';

interface QuizModuleProps {
  userProfile: UserProfile;
}

interface QuizHistoryItem {
    id: string;
    topic: string;
    score: number;
    total_questions: number;
    difficulty: string;
    created_at: string;
}

const QuizModule: React.FC<QuizModuleProps> = ({ userProfile }) => {
  const [view, setView] = useState<'selection' | 'quiz' | 'history'>('selection');
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
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  
  useEffect(() => {
    if (quizState === 'active' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (quizState === 'active' && timeLeft === 0 && questions.length > 0) {
      handleFinishQuiz();
    }
  }, [timeLeft, quizState, questions.length]);

  const fetchHistory = async () => {
    if (!supabase || !userProfile.id) return;
    const { data } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleFinishQuiz = async (finalScore?: number) => {
    const s = finalScore !== undefined ? finalScore : score;
    setQuizState('finished');
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
        setFileName('');
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleStartQuiz = async () => {
    if (!topic && !fileContent) return;
    setView('quiz');
    setQuizState('loading');
    setQuestions([]);
    try {
        const quizTopic = topic || `Doc: ${fileName}`;
        const generatedQuestions = await generateQuiz(quizTopic, 10, difficulty, fileContent ?? undefined);
        setQuestions(generatedQuestions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setQuizState('active');
        setTimeLeft(generatedQuestions.length * 30);
    } catch (error) {
        setQuizState('idle');
        setView('selection');
    }
  };

  const handleAnswer = (option: string) => {
    if (userAnswer || quizState !== 'active') return;
    
    setUserAnswer(option);
    const isCorrect = option === questions[currentQuestionIndex].correctAnswer;
    const newScore = isCorrect ? score + 1 : score;
    
    if (isCorrect) {
      setScore(newScore);
      setFeedback('Correct');
    } else {
      setFeedback('Incorrect');
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setUserAnswer(null);
        setFeedback('');
      } else {
        handleFinishQuiz(newScore);
      }
    }, 1500);
  };

  if (view === 'history') {
    return (
        <Card className="h-full flex flex-col p-5 lg:p-10 overflow-hidden">
            <header className="flex items-center justify-between mb-6 lg:mb-10">
                <button onClick={() => setView('selection')} className="apple-pill px-3 py-1 flex items-center gap-2 text-[var(--primary)] font-bold text-[13px]">
                    <ChevronLeftIcon className="w-3.5 h-3.5" /> Back
                </button>
                <h2 className="text-xl font-bold tracking-tight">Records</h2>
                <div className="w-12"></div>
            </header>
            <div className="flex-grow overflow-y-auto space-y-2 lg:space-y-3 px-1">
                {history.length === 0 ? (
                    <p className="text-center text-[var(--foreground-muted)] py-20 text-xs font-medium opacity-40 italic">No history yet.</p>
                ) : (
                    history.map((item) => (
                        <div key={item.id} className="p-4 lg:p-6 flex justify-between items-center bg-[var(--foreground)]/[0.03] rounded-2xl border border-[var(--card-border)]">
                            <div className="min-w-0 flex-1 pr-4">
                                <h4 className="font-bold text-[13px] lg:text-[15px] truncate mb-0.5">{item.topic}</h4>
                                <p className="text-[9px] font-black text-[var(--foreground-muted)] uppercase tracking-widest">{item.difficulty}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[15px] lg:text-[18px] font-black text-[var(--primary)]">{Math.round((item.score / item.total_questions) * 100)}%</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
  }

  if (view === 'selection') {
    const isLoading = quizState === 'loading' || isParsing;
    return (
      <Card className="flex flex-col items-center justify-center min-h-full p-6 lg:p-12 relative text-center">
        <button 
            onClick={() => { fetchHistory(); setView('history'); }} 
            className="absolute top-4 lg:top-10 right-4 lg:right-12 text-[10px] font-black tracking-widest text-[var(--primary)] uppercase"
        >
            History
        </button>
        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center mb-6">
            <BrainIcon className="w-8 h-8 lg:w-10 lg:h-10 text-[var(--primary)]" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl lg:text-4xl font-extrabold tracking-tighter mb-2">Smart Quiz</h2>
        <p className="text-[var(--foreground-muted)] mb-8 text-[14px] lg:text-[16px] font-medium max-w-sm">Assessments tailored to your materials.</p>
        
        <div className="flex justify-center gap-1 lg:gap-2 mb-8 bg-[var(--foreground)]/[0.04] p-1 rounded-full">
            {(['Easy', 'Moderate', 'Hard'] as const).map(level => (
                <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-4 lg:px-6 py-1.5 lg:py-2 rounded-full font-bold text-[11px] lg:text-[13px] transition-all ${difficulty === level ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'text-[var(--foreground-muted)]'}`}
                >
                    {level}
                </button>
            ))}
        </div>

        <div className="w-full max-w-xs space-y-3">
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic..."
              className="w-full px-5 py-3.5 ios-input rounded-2xl text-[14px] focus:outline-none"
            />
            <label className="cursor-pointer w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[var(--foreground)]/[0.03] rounded-2xl border border-dashed border-[var(--foreground-muted)]/20 text-[13px] font-bold text-[var(--foreground-muted)]">
                <UploadIcon className="w-4 h-4" />
                <span className="truncate">{fileName || 'Sync Doc'}</span>
                <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.pdf,.docx" />
            </label>
        </div>
        
        <button 
          onClick={handleStartQuiz}
          disabled={isLoading || (!topic && !fileContent)}
          className="mt-10 px-10 py-3.5 bg-[var(--primary)] text-white apple-pill text-[15px] shadow-lg disabled:opacity-20"
        >
          {isLoading ? 'Loading...' : 'Start'}
        </button>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  return (
    <Card className="h-full flex flex-col p-5 lg:p-10 overflow-hidden">
        <header className="flex justify-between items-center mb-6 lg:mb-12">
            <span className="font-black text-[9px] uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Step {currentQuestionIndex + 1}/{questions.length}</span>
            <div className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-black">{timeLeft}s</div>
        </header>
        
        <div className="flex-grow flex flex-col items-center justify-center overflow-y-auto pr-1">
            <h3 className="text-xl lg:text-2xl font-extrabold mb-6 lg:mb-10 text-center leading-tight max-w-xl">{currentQuestion?.question}</h3>
            <div className="grid grid-cols-1 gap-3 w-full max-w-xl">
                {currentQuestion?.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => !userAnswer && handleAnswer(option)}
                        className={`p-4 lg:p-5 rounded-2xl text-left transition-all font-semibold text-[14px] border-2
                        ${!userAnswer ? 'bg-[var(--foreground)]/[0.03] border-transparent hover:border-[var(--primary)]' : ''}
                        ${userAnswer && option === currentQuestion.correctAnswer ? 'bg-green-500/10 border-green-500 text-green-700' : ''}
                        ${userAnswer && option !== currentQuestion.correctAnswer && option === userAnswer ? 'bg-red-500/10 border-red-500 text-red-700' : ''}
                        `}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>

        <footer className="h-10 mt-6 flex items-center justify-center">
            {feedback && <p className="font-black text-[10px] tracking-[0.3em] text-[var(--primary)] uppercase">{feedback}</p>}
        </footer>
    </Card>
  );
};

export default QuizModule;
