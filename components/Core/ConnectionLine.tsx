import React from 'react';
import { getBezierPath } from '../../utils/geometry';
import { Position } from '../../types';

interface ConnectionLineProps {
  sourcePos: Position;
  targetPos: Position;
  isTemp?: boolean;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ sourcePos, targetPos, isTemp }) => {
  const pathData = getBezierPath(sourcePos, targetPos);

  return (
    <g className="pointer-events-none">
      {/* Shadow/Outline for visibility on dark backgrounds */}
      <path
        d={pathData}
        fill="none"
        stroke="#09090b"
        strokeWidth={4}
        strokeLinecap="round"
        className="opacity-50"
      />
      {/* Main Line */}
      <path
        d={pathData}
        fill="none"
        stroke={isTemp ? "#3b82f6" : "#52525b"}
        strokeWidth={2}
        strokeDasharray={isTemp ? "5,5" : "none"}
        className="transition-colors duration-300"
      >
        {isTemp && (
          <animate 
            attributeName="stroke-dashoffset" 
            from="100" 
            to="0" 
            dur="1s" 
            repeatCount="indefinite" 
          />
        )}
      </path>
      {/* Terminator dot for temp connections */}
      {isTemp && (
        <circle cx={targetPos.x} cy={targetPos.y} r={3} fill="#3b82f6" />
      )}
    </g>
  );
};