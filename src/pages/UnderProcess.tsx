import React from 'react';

const AnimatedProcessingIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="60" // Larger icon size
    height="60"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5" // Slightly thinner stroke for elegance
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-blue-500 dark:text-blue-400"
  >
    {/* Hourglass top */}
    <path d="M5 22h14" />
    <path d="M5 2h14" />
    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />

    {/* Fluid animation within the hourglass */}
    <g>
      <path
        d="M12 12 L17 17.828 L17 6.172 Z"
        fill="currentColor"
        className="origin-center animate-[fill-hourglass_4s_ease-in-out_infinite]"
        style={
          {
            animationDelay: '0s',
            '--tw-fill-color': 'rgb(59 130 246 / var(--tw-bg-opacity))', // Blue-500
          } as React.CSSProperties
        }
      />
      <path
        d="M12 12 L7 6.172 L7 17.828 Z"
        fill="currentColor"
        className="origin-center animate-[fill-hourglass_4s_ease-in-out_infinite]"
        style={
          {
            animationDelay: '0s',
            '--tw-fill-color': 'rgb(59 130 246 / var(--tw-bg-opacity))', // Blue-500
          } as React.CSSProperties
        }
      />
    </g>
  </svg>
);

function UnderProcess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 sm:p-6 font-inter">
      <style>
        {`
        @keyframes pulse-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        @keyframes fill-hourglass {
          0% { transform: scaleY(0); opacity: 0; }
          25% { transform: scaleY(1); opacity: 1; }
          75% { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(0); opacity: 0; }
        }
        .animate-pulse-once {
          animation: pulse-once 2s ease-in-out infinite;
        }

        .font-inter {
          font-family: 'Inter', sans-serif;
        }

        @keyframes progress-bar {
          0% { transform: translateX(-100%); width: 30%; }
          50% { transform: translateX(100%); width: 60%; }
          100% { transform: translateX(-100%); width: 30%; }
        }
        `}
      </style>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />


      <div className="flex flex-col items-center justify-center p-8 sm:p-10 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl space-y-5 w-full max-w-sm text-center animate-pulse-once border border-blue-200 dark:border-blue-700">
        {/* Animated Processing Icon (Hourglass) */}
        <AnimatedProcessingIcon />

        {/* Updated "Under Development" message */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 drop-shadow-sm">
          Module Under Development
        </h1>

        {/* Updated descriptive text for development phase */}
        <p className="text-gray-600 dark:text-gray-300 text-lg sm:text-xl leading-relaxed">
          We're hard at work building this feature! Please check back later for updates.
        </p>

        {/* The subtle loading bar still works to show something is happening behind the scenes */}
        <div className="w-full bg-blue-100 rounded-full h-3 dark:bg-blue-900 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-400 to-purple-500 h-full rounded-full animate-[progress-bar_2s_ease-in-out_infinite] w-[30%]"
            style={{ '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)' } as React.CSSProperties}
          ></div>
        </div>

      </div>
    </div>
  );
}

export default UnderProcess;