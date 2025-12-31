'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, FlaskConical } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { verifyPassword, setAuthCookie } from '@/lib/auth';

export function PasswordGate() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (verifyPassword(password)) {
      setAuthCookie();
      router.push('/dashboard');
    } else {
      setError('Access Denied');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center p-4">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
            animationDelay: '1s',
          }}
        />
      </div>

      {/* Login card */}
      <div
        className={`
          relative w-full max-w-md
          bg-lab-card/80 backdrop-blur-xl border border-lab-border
          rounded-2xl shadow-2xl p-8
          ${isShaking ? 'animate-shake' : 'animate-fade-in'}
        `}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-lab-accent rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-lab-accent/20">
            <FlaskConical className="w-8 h-8 text-lab-bg" />
          </div>
          <h1 className="text-2xl font-bold text-lab-text">Jalanea Lab</h1>
          <p className="text-sm text-lab-muted mt-1">Private Command Center</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
            showPasswordToggle
            error={error}
            autoComplete="current-password"
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={isLoading}
          >
            Enter Lab
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-lab-muted-dark mt-8">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
