import React, { useState, ChangeEvent } from 'react';
import { UserProfile } from '../types';
import Card from './GlassCard';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    photo: `https://picsum.photos/seed/${Date.now()}/200`,
  });
  const [photoPreview, setPhotoPreview] = useState<string>(formData.photo);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData(prev => ({...prev, photo: result}));
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = () => {
    if (formData.name && formData.age && formData.email) {
      onComplete(formData);
    } else {
      alert("Please fill out all fields. The AI overlords demand it.");
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto text-zinc-200">
        <h2 className="text-2xl font-bold text-center mb-2 text-zinc-100">Create Your Profile</h2>
        <p className="text-center text-zinc-400 mb-6">Tell us about you. We're not the FBI, promise.</p>

        <div className="w-full bg-zinc-700 rounded-full h-2.5 mb-6">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}></div>
        </div>

        <div className="overflow-hidden">
          {step === 1 && (
            <div className="animate-fade-in">
              <label className="block mb-2 font-semibold">What's your name?</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Alex Doe" className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          )}
          {step === 2 && (
            <div className="animate-fade-in">
              <label className="block mb-2 font-semibold">Email & Age</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your-email@school.edu" className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
              <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Your age (don't worry, we won't tell)" className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          {step === 3 && (
            <div className="animate-fade-in text-center">
              <label className="block mb-2 font-semibold">Upload a photo</label>
              <div className="flex justify-center items-center">
                <img src={photoPreview} alt="Profile preview" className="w-32 h-32 rounded-full object-cover border-4 border-zinc-700 shadow-md" />
              </div>
              <input type="file" id="photoUpload" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              <button onClick={() => document.getElementById('photoUpload')?.click()} className="mt-4 px-4 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition">Choose File</button>
            </div>
          )}
        </div>
        
        <div className="mt-8 flex justify-between">
          {step > 1 ? (
            <button onClick={prevStep} className="px-6 py-2 bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 transition">Back</button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={nextStep} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Next</button>
          ) : (
            <button onClick={handleSubmit} className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition">Finish</button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;