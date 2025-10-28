import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10'
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '', label }) => {
  const s = sizeClasses[size];

  return (
    <div className={`inline-flex items-center ${className}`}>
      <svg className={`${s} animate-spin`} viewBox="0 0 50 50" aria-hidden>
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <circle cx="25" cy="25" r="20" stroke="rgba(0,0,0,0.08)" strokeWidth="6" fill="none" />
        <path
          d="M45 25a20 20 0 0 1-20 20"
          stroke="url(#g1)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {label && <span className="ml-3 text-sm text-neutral-500">{label}</span>}
    </div>
  );
};

export default LoadingSpinner;

export const SkeletonLoader: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-neutral-200 rounded-md w-full relative overflow-hidden"
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            style={{
              transform: 'translateX(-110%)',
              animation: 'skeletonShimmer 1.1s linear infinite'
            }}
          />
        </div>
      ))}

      <style>{`
        @keyframes skeletonShimmer {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(110%); }
        }
      `}</style>
    </div>
  );
};