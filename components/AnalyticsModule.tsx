
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
        { name: 'Cards', score: stats.flashcardSets },
        { name: 'Score', score: stats.avgQuizScore },
    ];

    return (
        <div className="flex flex-col gap-6 w-full pb-20">
            {/* Stat Summary Cards - 3 Columns on Desktop, 1 Column on Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-2">Mastery</p>
                    <p className="text-4xl lg:text-5xl font-black text-[var(--primary)] tracking-tighter">{stats.avgQuizScore}%</p>
                    <p className="text-[10px] font-medium text-[var(--foreground-muted)] mt-2">Across {stats.quizzesTaken} Quizzes</p>
                </Card>
                <Card className="p-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-2">Tasks</p>
                    <p className="text-4xl lg:text-5xl font-black text-[var(--accent)] tracking-tighter">{completionRate}%</p>
                    <p className="text-[10px] font-medium text-[var(--foreground-muted)] mt-2">{stats.tasksDone}/{stats.tasksTotal} Completed</p>
                </Card>
                <Card className="p-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-2">Assets</p>
                    <p className="text-4xl lg:text-5xl font-black text-orange-500 tracking-tighter">{stats.flashcardSets}</p>
                    <p className="text-[10px] font-medium text-[var(--foreground-muted)] mt-2">Flashcard Decks</p>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 lg:p-8 flex flex-col min-h-[350px]">
                    <div className="flex items-center gap-3 mb-6">
                        <ChartBarIcon className="w-5 h-5 text-[var(--primary)]" />
                        <h3 className="text-lg font-bold tracking-tight">Academic Distribution</h3>
                    </div>
                    {isLoading ? (
                        <div className="flex-grow flex items-center justify-center"><div className="loader"></div></div>
                    ) : (
                        <div className="flex-grow w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={summaryItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--foreground-muted)', fontSize: 10, fontWeight: 700}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--foreground-muted)', fontSize: 10}} />
                                    <Tooltip cursor={{fill: 'rgba(0,113,227,0.05)'}} contentStyle={{backgroundColor: 'var(--card-bg)', border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                                    <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
                                        {summaryItems.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--primary)' : 'var(--accent)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>

                <Card className="p-6 lg:p-8 flex flex-col min-h-[350px]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]"></div>
                        <h3 className="text-lg font-bold tracking-tight">Consistency Trend</h3>
                    </div>
                    <div className="flex-grow w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={studyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--foreground-muted)', fontSize: 10, fontWeight: 700}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--foreground-muted)', fontSize: 10}} />
                                <Tooltip 
                                    contentStyle={{backgroundColor: 'var(--card-bg)', border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} 
                                    itemStyle={{color: 'var(--primary)', fontWeight: 800}}
                                />
                                <Line type="monotone" dataKey="hours" stroke="var(--primary)" strokeWidth={4} dot={{fill: 'var(--primary)', strokeWidth: 2, r: 4, stroke: '#fff'}} activeDot={{r: 6, strokeWidth: 0}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
            
            <div className="text-center opacity-40">
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">End of Sync History</p>
            </div>
        </div>
    );
};

export default AnalyticsModule;
