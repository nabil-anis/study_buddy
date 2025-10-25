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
                <PlannerIcon className="w-8 h-8 text-green-400 mr-3" />
                <h2 className="text-2xl font-bold text-zinc-100">AI Study Planner</h2>
            </div>
            <p className="text-zinc-400 mb-6">Tell the AI your study goal, and it will generate a step-by-step plan for you.</p>

            <div className="flex items-center gap-2 mb-6">
                <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGeneratePlan()}
                    placeholder="e.g., 'Ace my history final next week'"
                    className="flex-grow px-4 py-3 bg-zinc-800 rounded-full border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-zinc-100"
                    disabled={isLoading}
                />
                <button onClick={handleGeneratePlan} disabled={isLoading} className="p-3 rounded-full bg-green-600 text-white hover:bg-green-700 disabled:bg-green-500 transition">
                    <SendIcon className="w-6 h-6" />
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2">
                {isLoading && tasks.length === 0 && <p className="text-zinc-400 text-center">Generating your master plan...</p>}
                {tasks.length === 0 && !isLoading && <p className="text-zinc-500 text-center pt-8">Your study plan will appear here.</p>}
                <ul className="space-y-3">
                    {tasks.map(task => (
                        <li key={task.id} className="flex items-center bg-zinc-800 p-3 rounded-lg">
                            <input 
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => handleToggleTask(task.id)}
                                className="h-5 w-5 rounded border-gray-300 text-green-500 focus:ring-green-500 cursor-pointer"
                            />
                            <span className={`flex-grow mx-4 ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                                {task.text}
                            </span>
                            <button onClick={() => handleDeleteTask(task.id)} className="text-zinc-500 hover:text-red-500 transition">
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
