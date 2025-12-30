import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Lightbulb, BookOpen, FileText, Code2, Sparkles } from 'lucide-react';

const TOUR_STORAGE_KEY = 'jalanea_forge_tour_completed';

interface TourStep {
  title: string;
  description: string;
  icon: React.ElementType;
  highlight: string;
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to Jalanea Forge!',
    description: 'Transform your product ideas into reality with our AI-powered 4-step workflow. Let us show you around.',
    icon: Sparkles,
    highlight: 'intro',
  },
  {
    title: 'Step 1: Idea',
    description: 'Start by describing your product vision. Our AI will refine it into a clear, professional vision statement.',
    icon: Lightbulb,
    highlight: 'idea',
  },
  {
    title: 'Step 2: Research',
    description: 'Upload documents or use our NotebookLM prompts to gather market research and ground your project in data.',
    icon: BookOpen,
    highlight: 'research',
  },
  {
    title: 'Step 3: PRD',
    description: 'Generate a comprehensive Product Requirements Document. Refine it with AI or edit manually.',
    icon: FileText,
    highlight: 'prd',
  },
  {
    title: 'Step 4: Realization',
    description: 'Get a step-by-step implementation roadmap with AI prompts ready to paste into your coding tools.',
    icon: Code2,
    highlight: 'realization',
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if tour was already completed
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted) {
      // Small delay before showing tour
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* Tour Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-forge-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-forge-700 animate-in zoom-in-95 duration-300">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100 dark:bg-forge-800">
          <div
            className="h-full bg-forge-accent transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                isFirstStep
                  ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-500/20'
                  : 'bg-forge-accent shadow-orange-500/20'
              }`}>
                <StepIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-forge-accent uppercase tracking-widest">
                  {isFirstStep ? 'Getting Started' : `Step ${currentStep} of 4`}
                </p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                  {step.title}
                </h3>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-forge-muted dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-forge-800 transition-colors"
              aria-label="Skip tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-gray-600 dark:text-forge-muted leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-forge-accent w-6'
                  : 'bg-gray-300 dark:bg-forge-700 hover:bg-gray-400 dark:hover:bg-forge-600'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-forge-800/50 border-t border-gray-100 dark:border-forge-700 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 dark:text-forge-muted hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-forge-muted hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-5 py-2.5 bg-forge-accent hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all"
            >
              {isLastStep ? (
                <>Get Started</>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export function to manually reset tour (for testing)
export const resetOnboardingTour = () => {
  localStorage.removeItem(TOUR_STORAGE_KEY);
};
