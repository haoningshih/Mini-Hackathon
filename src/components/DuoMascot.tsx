import React from 'react';

interface DuoMascotProps {
  mood?: 'waving' | 'cheering' | 'thinking' | 'coaching' | 'talking';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const DuoMascot: React.FC<DuoMascotProps> = ({
  mood = 'waving',
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36',
  };

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${sizeMap[size]} ${className}`}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Shadow */}
        <ellipse cx="60" cy="112" rx="36" ry="6" fill="#000000" fillOpacity="0.18" />

        {/* Feet */}
        <ellipse cx="44" cy="106" rx="10" ry="5" fill="#e57c00" />
        <ellipse cx="76" cy="106" rx="10" ry="5" fill="#e57c00" />
        <ellipse cx="44" cy="104" rx="8" ry="4" fill="#ff9600" />
        <ellipse cx="76" cy="104" rx="8" ry="4" fill="#ff9600" />

        {/* Body Main Green */}
        <path
          d="M60 14C35 14 22 36 22 68C22 92 38 108 60 108C82 108 98 92 98 68C98 36 85 14 60 14Z"
          fill="#58cc02"
        />

        {/* Dark Green Belly Feather Border */}
        <path
          d="M60 52C46 52 36 68 36 86C36 98 46 106 60 106C74 106 84 98 84 86C84 68 74 52 60 52Z"
          fill="#46a302"
        />

        {/* Light Green Belly Center */}
        <path
          d="M60 56C48 56 40 70 40 86C40 96 48 102 60 102C72 102 80 96 80 86C80 70 72 56 60 56Z"
          fill="#58cc02"
        />

        {/* Wings */}
        {mood === 'cheering' ? (
          <>
            {/* Left wing raised */}
            <path
              d="M24 64C16 52 14 36 26 28C32 24 38 34 32 50C28 60 25 63 24 64Z"
              fill="#46a302"
            />
            {/* Right wing raised */}
            <path
              d="M96 64C104 52 106 36 94 28C88 24 82 34 88 50C92 60 95 63 96 64Z"
              fill="#46a302"
            />
          </>
        ) : mood === 'waving' ? (
          <>
            {/* Left wing normal */}
            <path
              d="M24 60C16 66 16 82 24 88C28 82 30 72 28 62Z"
              fill="#46a302"
            />
            {/* Right wing waving up */}
            <path
              d="M96 64C106 54 110 38 98 32C92 28 88 38 92 52C94 60 95 63 96 64Z"
              fill="#46a302"
            />
          </>
        ) : (
          <>
            {/* Both wings rested */}
            <path
              d="M23 60C15 68 15 84 24 90C28 84 30 72 27 62Z"
              fill="#46a302"
            />
            <path
              d="M97 60C105 68 105 84 96 90C92 84 90 72 93 62Z"
              fill="#46a302"
            />
          </>
        )}

        {/* Big Eye Outer Rings (White) */}
        <circle cx="44" cy="46" r="16" fill="#ffffff" />
        <circle cx="76" cy="46" r="16" fill="#ffffff" />

        {/* Pupil Iris Outer (Dark Brown / Black) */}
        <circle cx="46" cy="46" r="8.5" fill="#2e1405" />
        <circle cx="74" cy="46" r="8.5" fill="#2e1405" />

        {/* Pupils Shine / Catchlight */}
        <circle cx="48" cy="43" r="3.2" fill="#ffffff" />
        <circle cx="76" cy="43" r="3.2" fill="#ffffff" />
        <circle cx="44" cy="48" r="1.5" fill="#ffffff" />
        <circle cx="72" cy="48" r="1.5" fill="#ffffff" />

        {/* Glasses for Coaching / Thinking */}
        {mood === 'coaching' && (
          <>
            <circle cx="44" cy="46" r="18" stroke="#1cb0f6" strokeWidth="3.5" fill="none" />
            <circle cx="76" cy="46" r="18" stroke="#1cb0f6" strokeWidth="3.5" fill="none" />
            <line x1="62" y1="46" x2="58" y2="46" stroke="#1cb0f6" strokeWidth="3.5" strokeLinecap="round" />
          </>
        )}

        {/* Coach Hat or Graduation Cap */}
        {mood === 'coaching' && (
          <g transform="translate(18, -4)">
            <polygon points="42,8 78,16 42,24 6,16" fill="#1cb0f6" />
            <polygon points="42,10 74,17 42,23 10,17" fill="#0482c8" />
            <rect x="34" y="21" width="16" height="8" rx="2" fill="#0482c8" />
            <circle cx="42" cy="16" r="2.5" fill="#ffd900" />
            <line x1="42" y1="16" x2="68" y2="28" stroke="#ffd900" strokeWidth="2" strokeLinecap="round" />
            <circle cx="68" cy="28" r="3" fill="#ffd900" />
          </g>
        )}

        {/* Cheering Party Hat */}
        {mood === 'cheering' && (
          <g transform="translate(32, -10)">
            <polygon points="28,2 14,32 42,32" fill="#ff4b4b" />
            <polygon points="28,2 20,32 36,32" fill="#ffd900" />
            <circle cx="28" cy="2" r="4" fill="#ffffff" />
            <circle cx="24" cy="18" r="2" fill="#1cb0f6" />
            <circle cx="32" cy="24" r="2.5" fill="#2ce080" />
          </g>
        )}

        {/* Beak / Nose (Orange) */}
        <polygon points="60,60 52,50 68,50" fill="#e57c00" />
        <polygon points="60,58 53,50 67,50" fill="#ff9600" />

        {/* Cheeks blush */}
        <ellipse cx="30" cy="56" rx="5" ry="3" fill="#ff4b4b" fillOpacity="0.4" />
        <ellipse cx="90" cy="56" rx="5" ry="3" fill="#ff4b4b" fillOpacity="0.4" />

        {/* Mouth smile when talking */}
        {mood === 'talking' && (
          <path
            d="M54 62C57 66 63 66 66 62"
            stroke="#e57c00"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};
