import { useRef } from 'react';

interface PitchCanvasProps {
  onClick: (x: number, y: number) => void;
  isScore: boolean;
  clickedLocation?: { x: number; y: number } | null;
}

export const PitchCanvas = ({ onClick, isScore, clickedLocation }: PitchCanvasProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 120;
    onClick(x, y);
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 120"
      className="w-full max-w-md cursor-crosshair"
      onClick={handleClick}
    >
      {/* Pitch background */}
      <rect x="0" y="0" width="100" height="120" fill="#228B22" />
      
      {/* Pitch outline */}
      <rect x="5" y="5" width="90" height="110" fill="none" stroke="white" strokeWidth="0.8" />
      
      {/* Goals - H shape */}
      <line x1="42" y1="0" x2="42" y2="5" stroke="white" strokeWidth="0.8" />
      <line x1="58" y1="0" x2="58" y2="5" stroke="white" strokeWidth="0.8" />
      <line x1="42" y1="3" x2="58" y2="3" stroke="white" strokeWidth="0.8" />
      
      {/* Small rectangle (goal area / 6 yard box) */}
      <rect x="39" y="5" width="22" height="8" fill="none" stroke="white" strokeWidth="0.8" />
      
      {/* 14m line - straight across */}
      <line x1="5" y1="22" x2="95" y2="22" stroke="white" strokeWidth="0.8" />
      
      {/* Penalty area vertical lines - from 14m line to endline */}
      <line x1="32" y1="5" x2="32" y2="22" stroke="white" strokeWidth="0.8" />
      <line x1="68" y1="5" x2="68" y2="22" stroke="white" strokeWidth="0.8" />
      
      {/* 20m line - straight across */}
      <line x1="5" y1="29" x2="95" y2="29" stroke="white" strokeWidth="0.8" />
      
      {/* Large D/arc (20m arc) - semicircle curving DOWN from 20m line */}
      <path
        d="M 15 29 A 35 30 0 0 0 85 29"
        fill="none"
        stroke="white"
        strokeWidth="0.8"
      />
      
      {/* Small D/arc (13m arc) - smaller semicircle curving DOWN */}
      <path
        d="M 30 29 A 20 18 0 0 0 70 29"
        fill="none"
        stroke="white"
        strokeWidth="0.8"
      />
      
      {/* 45m line - solid */}
      <line x1="5" y1="70" x2="95" y2="70" stroke="white" strokeWidth="0.8" />
      
      {/* 65m line - dashed */}
      <line x1="5" y1="100" x2="95" y2="100" stroke="white" strokeWidth="0.8" strokeDasharray="3,2" />

      {/* Clicked location marker */}
      {clickedLocation && (
        <text
          x={clickedLocation.x}
          y={clickedLocation.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isScore ? '#4ade80' : '#ef4444'}
          fontSize="8"
          fontWeight="bold"
        >
          {isScore ? '✓' : '✗'}
        </text>
      )}

      {/* Instruction text */}
      {!clickedLocation && (
        <text x="50" y="90" textAnchor="middle" fill="white" fontSize="4" opacity="0.7">
          Tap to mark {isScore ? '✓ score' : '✗ miss'} location
        </text>
      )}
    </svg>
  );
};
