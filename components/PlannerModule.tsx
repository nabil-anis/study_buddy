import React, { useState, useEffect } from 'react';
import { Task, UserProfile } from '../types';
import { generateStudyPlan } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import Card from './GlassCard';
import { PlannerIcon, SendIcon } from './icons';

interface PlannerModuleProps {
    userProfile: UserProfile;
}

const PlannerModule: React.FC<PlannerModuleProps> = ({ userProfile }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [goal, setGoal] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, [userProfile.id]);

    const fetchTasks = async () => {
        if (!supabase || !userProfile.id) return;
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userProfile.id)
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setTasks(data);
        }
    };

    const handleGeneratePlan = async () => {
        if (!goal.trim()) {
            alert("Please enter a goal. What are we planning for? World domination?");
            return;
        }
        setIsLoading(true);
        try {
            const taskTexts = await generateStudyPlan(goal);
            
            if (supabase && userProfile.id) {
                const newTasksData = taskTexts.map(text => ({
                    user_id: userProfile.id,
                    text,
                    completed: false,
                }));
                const { data, error } = await supabase
                    .from('tasks')
                    .insert(newTasksData)
                    .select();
                
                if (!error && data) {
                    setTasks(prev => [...data, ...prev]);
                } else {
                    console.error("Supabase insert error:", error);
                }
            } else {
                const newTasks: Task[] = taskTexts.map((text, index) => ({
                    id: Date.now() + index,
                    text,
                    completed: false,
                }));
                setTasks(prev => [...newTasks, ...prev]);
            }
            setGoal('');
        } catch (error) {
            console.error("Error generating study plan:", error);
            alert("The AI planner is a bit overwhelmed. Try a simpler goal or check back later.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleToggleTask = async (task: Task) => {
        const newCompleted = !task.completed;
        
        if (supabase && userProfile.id) {
            const { error } = await supabase
                .from('tasks')
                .update({ completed: newCompleted })
                .eq('id', task.id);
            
            if (!error) {
                setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: newCompleted } : t));
            }
        } else {
            setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: newCompleted } : t));
        }
    };

    const handleDeleteTask = async (id: string | number) => {
        if (supabase && userProfile.id) {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);
            
            if (!error) {
                setTasks(tasks.filter(task => task.id !== id));
            }
        } else {
            setTasks(tasks.filter(task => task.id !== id));
        }
    };

    return (
        <Card className="h-full flex flex-col p-4 sm:p-6">
            <div className="flex items-center mb-4">
                <PlannerIcon className="w-8 h-8 text-[var(--accent)] mr-3" />
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">AI Study Planner</h2>
            </div>
            <p className="text-[var(--foreground-muted)] mb-6">Tell the AI your study goal, and it will generate a step-by-step plan for you.</p>

            <div className="flex items-center gap-2 mb-6">
                <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGeneratePlan()}
                    placeholder="e.g., 'Ace my history final next week'"
                    className="flex-grow px-4 py-3 bg-[var(--input-bg)] rounded-full border border-[var(--input-border)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--foreground)]"
                    disabled={isLoading}
                />
                <button onClick={handleGeneratePlan} disabled={isLoading} className="p-3 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-opacity-90 disabled:bg-opacity-60 transition-transform transform enabled:hover:scale-110">
                    {isLoading ? <div className="loader !w-6 !h-6 !border-[var(--accent-foreground)] !border-b-transparent"></div> : <SendIcon className="w-6 h-6" />}
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2 -mr-4">
                {tasks.length === 0 && !isLoading && <p className="text-[var(--foreground-muted)] text-center pt-8">Your generated study plan will appear here.</p>}
                <ul className="space-y-3">
                    {tasks.map(task => (
                        <li key={task.id} className="flex items-center bg-[var(--input-bg)] p-3 rounded-lg border border-[var(--input-border)] transition-colors group">
                            <input 
                                type="checkbox"
                                id={`task-${task.id}`}
                                checked={task.completed}
                                onChange={() => handleToggleTask(task)}
                                className="h-5 w-5 rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer bg-transparent"
                            />
                            <label htmlFor={`task-${task.id}`} className={`flex-grow mx-4 cursor-pointer ${task.completed ? 'line-through text-[var(--foreground-muted)]' : 'text-[var(--foreground)]'}`}>
                                {task.text}
                            </label>
                            <button onClick={() => handleDeleteTask(task.id)} className="text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors text-xl font-bold opacity-0 group-hover:opacity-100">
                                &times;
                            </button>
                        </li>
                    ))}
                     {isLoading && (
                      <li className="flex justify-center items-center p-4">
                        <div className="loader !border-[var(--accent)] !border-b-transparent"></div>
                        <span className="ml-3 text-[var(--foreground-muted)]">Generating plan...</span>
                      </li>
                    )}
                </ul>
            </div>
        </Card>
    );
};

export default PlannerModule;