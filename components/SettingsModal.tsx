
import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, Check, AlertCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { testApiKey } from '../services/geminiService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDismissible?: boolean; // If false, user cannot close without saving a key (for forced prompt)
}

type ConnectionStatus = 'idle' | 'testing' | 'connected' | 'error';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isDismissible = true }) => {
    const [apiKey, setApiKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [connectionError, setConnectionError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const storedKey = localStorage.getItem('jalanea_gemini_key');
            if (storedKey) {
                setApiKey(storedKey);
                // Auto-check connection status for existing key
                setConnectionStatus('connected');
            } else {
                setConnectionStatus('idle');
            }
            setConnectionError('');
        }
    }, [isOpen]);

    const handleTestConnection = async () => {
        if (!apiKey.trim()) return;

        setConnectionStatus('testing');
        setConnectionError('');

        const result = await testApiKey(apiKey.trim());

        if (result.success) {
            setConnectionStatus('connected');
        } else {
            setConnectionStatus('error');
            setConnectionError(result.error || 'Connection failed');
        }
    };

    const handleSave = () => {
        if (!apiKey.trim()) return;
        localStorage.setItem('jalanea_gemini_key', apiKey.trim());
        setIsSaved(true);
        setConnectionStatus('connected');
        setTimeout(() => {
            setIsSaved(false);
            onClose();
        }, 1500);
    };

    const handleClear = () => {
        localStorage.removeItem('jalanea_gemini_key');
        setApiKey('');
        setConnectionStatus('idle');
        setConnectionError('');
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden ring-1 ring-gray-200">

                {/* Header */}
                <div className="bg-forge-950 p-6 border-b border-forge-800">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-lg bg-forge-accent flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Key className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Activate Jalanea Forge</h2>
                                <p className="text-forge-400 text-sm mt-1">Connect your AI to start building.</p>
                            </div>
                        </div>
                        {isDismissible && (
                            <button
                                onClick={onClose}
                                className="text-forge-500 hover:text-white transition-colors"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    <div className="space-y-4">
                        {/* Step 1 */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs ring-1 ring-blue-200 shrink-0">1</div>
                                <div>
                                    <h3 className="font-semibold text-blue-900 text-sm">Get your free API Key</h3>
                                    <p className="text-blue-700 text-xs mt-1 mb-3">Google offers a generous free tier for personal use.</p>
                                    <a
                                        href="https://aistudio.google.com/app/apikey"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg text-blue-700 text-sm font-semibold hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"
                                    >
                                        Get Key from Google <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs ring-1 ring-gray-200">2</div>
                                Paste Key Here
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => {
                                        setApiKey(e.target.value);
                                        // Reset status when key changes
                                        if (connectionStatus !== 'idle') {
                                            setConnectionStatus('idle');
                                            setConnectionError('');
                                        }
                                    }}
                                    placeholder="AIzaSy..."
                                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-forge-accent focus:border-transparent outline-none transition-all font-mono text-sm text-gray-800"
                                />
                                {apiKey && connectionStatus === 'connected' && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-forge-muted pl-1">
                                Your key is stored locally in your browser. It is never sent to our servers.
                            </p>
                        </div>

                        {/* Connection Status & Test Button */}
                        <div className="space-y-3">
                            <button
                                onClick={handleTestConnection}
                                disabled={!apiKey.trim() || connectionStatus === 'testing'}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                            >
                                {connectionStatus === 'testing' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Testing Connection...
                                    </>
                                ) : (
                                    <>
                                        <Wifi className="w-4 h-4" />
                                        Test Connection
                                    </>
                                )}
                            </button>

                            {/* Status Indicator */}
                            {connectionStatus === 'connected' && (
                                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl animate-fade-in">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-800">Connected</p>
                                        <p className="text-xs text-emerald-600">API key is valid and working</p>
                                    </div>
                                </div>
                            )}

                            {connectionStatus === 'error' && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                        <WifiOff className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-red-800">Connection Failed</p>
                                        <p className="text-xs text-red-600">{connectionError}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        {isDismissible && (
                            <button
                                onClick={handleClear}
                                className="px-4 py-3 rounded-xl font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 text-sm transition-colors"
                            >
                                Clear Key
                            </button>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={!apiKey}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold shadow-lg transition-all ${isSaved
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                    : 'bg-forge-accent hover:bg-orange-600 text-white shadow-orange-500/20'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isSaved ? (
                                <>Saved <Check className="w-5 h-5" /></>
                            ) : (
                                "Save & Connect"
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
