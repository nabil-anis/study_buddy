
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import Card from './GlassCard';
import { supabase } from '../services/supabaseClient';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Cell 
} from 'recharts';
import { ChartBarIcon } from './icons';

interface AnalyticsModuleProps {
    userProfile: UserProfile;
}

const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({ userProfile }) => {
    const [stats, setStats] = useState({ 
        tasksTotal: 0, 
        tasksDone: 0, 
        quizzesTaken: 0, 
        flashcardSets: 0, 
        avgQuizScore: 0 
    });
    const [isLoading, setIsLoading] = useState(true);

    // Mock weekly study time (AI simulated)
    const studyData = [
        { day: 'Mon', hours: 2.5 },
        { day: 'Tue', hours: 4.2 },
        { day: 'Wed', hours: 1.8 },
        { day: 'Thu', hours: 3.5 },
        { day: 'Fri', hours: 5.0 },
        { day: 'Sat', hours: 2.2 },
        { day: 'Sun', hours: 3.0 },
    ];

    useEffect(() => {
        const fetchRealStats = async () => {
            if (!supabase || !userProfile.id) return;
            
            setIsLoading(true);
            try {
                const [tasks, quizzes, flashcards] = await Promise.all([
                    supabase.from('tasks').select('completed').eq('user_id', userProfile.id),
                    supabase.from('quizzes').select('score, total_questions').eq('user_id', userProfile.id),
                    supabase.from('flashcard_sets').select('id').eq('user_id', userProfile.id)
                ]);

                const tasksTotal = tasks.data?.length || 0;
                const tasksDone = tasks.data?.filter(t => t.completed).length || 0;
                const quizzesTaken = quizzes.data?.length || 0;
                const flashcardSets = flashcards.data?.length || 0;

                let avgScore = 0;
                if (quizzesTaken > 0 && quizzes.data) {
                    const totalPct = quizzes.data.reduce((acc, q) => acc + (q.score / q.total_questions), 0);
                    avgScore = Math.round((totalPct / quizzesTaken) * 100);
                }

                setStats({ tasksTotal, tasksDone, quizzesTaken, flashcardSets, avgQuizScore: avgScore });
            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRealStats();
    }, [userProfile.id]);

    const completionRate = stats.tasksTotal > 0 ? Math.round((stats.tasksDone / stats.tasksTotal) * 100) : 0;

    const summaryItems = [
        { name: 'Quizzes', score: stats.quizzesTaken },
        { name: 'Flashcards', score: stats.flashcardSets },
        { name: 'Avg Score', score: stats.avgQuizScore },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-y-auto pb-10">
            <Card className="flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                    <ChartBarIcon className="w-6 h-6 text-[var(--primary)]" />
                    <h3 className="text-xl font-bold">Cloud Activity Sync</h3>
                </div>
                {isLoading ? (
                    <div className="flex items-center justify-center h-64"><div className="loader"></div></div>
                ) : (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summaryItems}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--foreground-muted)', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--foreground-muted)', fontSize: 12}} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: 'var(--card-bg)', border: 'none', borderRadius: '8px'}} />
                                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                                    {summaryItems.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--primary)' : 'var(--accent)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
                <div className="mt-4 text-center">
                    <p className="text-sm text-[var(--foreground-muted)]">Data retrieved from your <span className="text-[var(--primary)] font-bold">Supabase Project</span></p>
                </div>
            </Card>

            <Card className="flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-[var(--accent)]"></div>
                    <h3 className="text-xl font-bold">AI Study Consistency</h3>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={studyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--foreground-muted)', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--foreground-muted)', fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', borderRadius: '12px'}} 
                                itemStyle={{color: 'var(--primary)'}}
                            />
                            <Line type="monotone" dataKey="hours" stroke="var(--primary)" strokeWidth={3} dot={{fill: 'var(--primary)', r: 4}} activeDot={{r: 8}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card className="lg:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <div>
                        <p className="text-[var(--foreground-muted)] text-sm uppercase tracking-widest font-bold mb-1">Concept Mastery</p>
                        <p className="text-5xl font-black text-[var(--primary)]">{stats.avgQuizScore}%</p>
                        <p className="text-xs text-[var(--foreground-muted)] mt-2">Based on {stats.quizzesTaken} Quiz Turns</p>
                    </div>
                    <div>
                        <p className="text-[var(--foreground-muted)] text-sm uppercase tracking-widest font-bold mb-1">Task Efficiency</p>
                        <p className="text-5xl font-black text-[var(--accent)]">{completionRate}%</p>
                        <p className="text-xs text-[var(--foreground-muted)] mt-2">{stats.tasksDone}/{stats.tasksTotal} Planner Tasks Completed</p>
                    </div>
                    <div>
                        <p className="text-[var(--foreground-muted)] text-sm uppercase tracking-widest font-bold mb-1">Learning Assets</p>
                        <p className="text-5xl font-black text-orange-500">{stats.flashcardSets}</p>
                        <p className="text-xs text-[var(--foreground-muted)] mt-2">Flashcard Decks in Cloud</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AnalyticsModule;
