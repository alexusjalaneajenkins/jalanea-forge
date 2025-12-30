import React, { useEffect, useState, useCallback } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
  shape: 'square' | 'circle' | 'triangle';
}

const COLORS = [
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#22c55e', // green-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
];

const SHAPES = ['square', 'circle', 'triangle'] as const;

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  duration = 3000,
  particleCount = 50,
  onComplete,
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const createPieces = useCallback(() => {
    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < particleCount; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        rotation: Math.random() * 360,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: 2 + Math.random() * 3,
        rotationSpeed: (Math.random() - 0.5) * 10,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      });
    }
    return newPieces;
  }, [particleCount]);

  useEffect(() => {
    if (active && !isAnimating) {
      setIsAnimating(true);
      setPieces(createPieces());

      const timer = setTimeout(() => {
        setIsAnimating(false);
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, isAnimating, createPieces, duration, onComplete]);

  if (!isAnimating || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.shape !== 'triangle' ? piece.color : 'transparent',
            borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'square' ? '2px' : '0',
            borderLeft: piece.shape === 'triangle' ? `${piece.size / 2}px solid transparent` : undefined,
            borderRight: piece.shape === 'triangle' ? `${piece.size / 2}px solid transparent` : undefined,
            borderBottom: piece.shape === 'triangle' ? `${piece.size}px solid ${piece.color}` : undefined,
            transform: `rotate(${piece.rotation}deg)`,
            '--fall-delay': `${Math.random() * 0.5}s`,
            '--fall-duration': `${2 + Math.random() * 2}s`,
            '--sway-amount': `${(Math.random() - 0.5) * 100}px`,
            '--rotation-amount': `${piece.rotationSpeed * 360}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

// Hook for triggering confetti
export const useConfetti = () => {
  const [showConfetti, setShowConfetti] = useState(false);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
  }, []);

  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  return {
    showConfetti,
    triggerConfetti,
    handleConfettiComplete,
  };
};
