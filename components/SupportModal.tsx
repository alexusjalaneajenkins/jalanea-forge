import React, { useState } from 'react';
import { X, Mail, Bug, Sparkles, Loader2, Copy, Check } from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import { useProject } from '../contexts/ProjectContext';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
    const { state } = useProject();
    const [errorInput, setErrorInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [emailDraft, setEmailDraft] = useState<{ subject: string, body: string } | null>(null);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleAnalyze = async () => {
        if (!errorInput.trim()) return;
        setIsAnalyzing(true);
        try {
            // Create context from project state
            const context = `Project: ${state.title}\nVision: ${state.synthesizedIdea.substring(0, 200)}...\nTech Stack: React, Firebase, Tailwind`;
            const draft = await GeminiService.refineBugReport(errorInput, context);
            setEmailDraft(draft);
        } catch (error) {
            console.error("Failed to analyze bug:", error);
            alert("Failed to analyze bug. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSendEmail = () => {
        if (!emailDraft) return;
        const mailtoLink = `mailto:support@jalaneaforge.com?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`;
        window.location.href = mailtoLink;
    };

    const copyToClipboard = () => {
        if (!emailDraft) return;
        navigator.clipboard.writeText(`${emailDraft.subject}\n\n${emailDraft.body}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-forge-950 rounded-2xl shadow-2xl w-full max-w-2xl border border-forge-700 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-forge-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-forge-text flex items-center gap-2">
                            <Bug className="w-5 h-5 text-red-500" />
                            Developer Support & Bug Reporting
                        </h2>
                        <p className="text-sm text-forge-muted mt-1">Found a bug? Paste the error below and AI will format it for the developer.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-forge-800 rounded-lg text-forge-muted hover:text-forge-text transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">

                    {/* Step 1: Input */}
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-forge-text">
                            1. Paste your Error Log or describe the issue:
                        </label>
                        <textarea
                            className="w-full h-32 bg-forge-900 border border-forge-700 rounded-xl p-4 text-forge-text font-mono text-sm resize-none focus:ring-2 focus:ring-forge-accent focus:outline-none placeholder-forge-500"
                            placeholder="E.g., Error: verifyIdToken failed: Firebase: Error (auth/configuration-not-found)."
                            value={errorInput}
                            onChange={(e) => setErrorInput(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handleAnalyze}
                                disabled={!errorInput.trim() || isAnalyzing}
                                className="bg-forge-accent hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
                            >
                                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {isAnalyzing ? "Analyzing Error..." : "Analyze & Generate Report"}
                            </button>
                        </div>
                    </div>

                    {/* Step 2: Result */}
                    {emailDraft && (
                        <div className="animate-fade-in space-y-4 border-t border-forge-700 pt-6">
                            <label className="block text-sm font-semibold text-forge-text flex items-center gap-2">
                                <Mail className="w-4 h-4 text-emerald-500" />
                                2. Ready to Send
                            </label>

                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                                    <div className="text-sm font-medium text-gray-700">Subject: <span className="font-normal select-all">{emailDraft.subject}</span></div>
                                    <button onClick={copyToClipboard} className="text-gray-500 hover:text-gray-900" title="Copy All">
                                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="p-5 text-gray-800 text-sm whitespace-pre-wrap leading-relaxed font-sans">
                                    {emailDraft.body}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleSendEmail}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                                >
                                    <Mail className="w-5 h-5" />
                                    Open Email Client (Send to Dev)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
