import React, { useState } from 'react';
import { Task } from '../types';
import { generateStudyPlan } from '../services/geminiService';
import Card from './GlassCard';
import { PlannerIcon, SendIcon } from './icons';

const PlannerModule: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [goal, setGoal] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [nextId, setNextId] = useState(1);

    const handleGeneratePlan = async () => {
        if (!goal.trim()) {
            alert("Please enter a goal. What are we planning for? World domination?");
            return;
        }
        setIsLoading(true);
        try {
            const taskTexts = await generateStudyPlan(goal);
            const newTasks: Task[] = taskTexts.map((text, index) => ({
                id: nextId + index,
                text,
                completed: false,
            }));
            setTasks(prev => [...prev, ...newTasks]);
            setNextId(prev => prev + newTasks.length);
            setGoal('');
        } catch (error) {
            console.error("Error generating study plan:", error);
            alert("The AI planner is a bit overwhelmed. Try a simpler goal or check back later.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleToggleTask = (id: number) => {
        setTasks(tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };
    
    const handleAddTask = (text: string) => {
      if (!text.trim()) return;
      const newTask: Task = { id: nextId, text, completed: false };
      setTasks([...tasks, newTask]);
      setNextId(nextId + 1);
    }

    const handleDeleteTask = (id: number) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    return (
        <Card className="h-full flex flex-col">
            <div className="flex items-center mb-4">
                <PlannerIcon className="w-8 h-8 text-[#ED3F27] mr-3" />
                <h2 className="text-2xl font-bold text-[#134686]">AI Study Planner</h2>
            </div>
            <p className="text-[#134686]/80 mb-6">Tell the AI your study goal, and it will generate a step-by-step plan for you.</p>

            <div className="flex items-center gap-2 mb-6">
                <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGeneratePlan()}
                    placeholder="e.g., 'Ace my history final next week'"
                    className="flex-grow px-4 py-3 bg-white/50 rounded-full border border-[#134686]/20 placeholder:text-[#134686]/60 focus:outline-none focus:ring-2 focus:ring-[#ED3F27] text-[#134686]"
                    disabled={isLoading}
                />
                <button onClick={handleGeneratePlan} disabled={isLoading} className="p-3 rounded-full bg-[#ED3F27] text-white hover:bg-[#ED3F27]/90 disabled:bg-[#ED3F27]/60 transition">
                    <SendIcon className="w-6 h-6" />
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2">
                {isLoading && tasks.length === 0 && <p className="text-[#134686]/70 text-center">Generating your master plan...</p>}
                {tasks.length === 0 && !isLoading && <p className="text-[#134686]/60 text-center pt-8">Your study plan will appear here.</p>}
                <ul className="space-y-3">
                    {tasks.map(task => (
                        <li key={task.id} className="flex items-center bg-white/60 p-3 rounded-lg">
                            <input 
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => handleToggleTask(task.id)}
                                className="h-5 w-5 rounded border-gray-300 text-[#ED3F27] focus:ring-[#ED3F27] cursor-pointer"
                            />
                            <span className={`flex-grow mx-4 ${task.completed ? 'line-through text-[#134686]/50' : 'text-[#134686]'}`}>
                                {task.text}
                            </span>
                            <button onClick={() => handleDeleteTask(task.id)} className="text-[#134686]/50 hover:text-[#ED3F27] transition">
                                &times;
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
};

export default PlannerModule;