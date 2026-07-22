import React from 'react';

export default function LoaderSuccessIcon({ className = '', style = {} }) {
  return (
    <svg 
      className={className} 
      style={style}
      width="80" 
      height="80" 
      viewBox="0 0 80 80" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ldrArcCheck" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE28A"/>
          <stop offset=".5" stopColor="#F3C24A"/>
          <stop offset="1" stopColor="#A020F0"/>
        </linearGradient>

        <style>
          {`
            @keyframes draw-circle {
              from { stroke-dashoffset: 200; }
              to { stroke-dashoffset: 0; }
            }
            @keyframes draw-check {
              from { stroke-dashoffset: 100; }
              to { stroke-dashoffset: 0; }
            }
            .success-circle {
              stroke-dasharray: 200;
              stroke-dashoffset: 200;
              transform-origin: 40px 40px;
              transform: rotate(-90deg);
              animation: draw-circle 0.5s ease-out forwards;
            }
            .success-check {
              stroke-dasharray: 100;
              stroke-dashoffset: 100;
              animation: draw-check 0.4s ease-out 0.4s forwards;
            }
          `}
        </style>
      </defs>

      <circle cx="40" cy="40" r="30" stroke="rgba(255,226,138,.1)" strokeWidth="5" fill="none"/>
      <circle className="success-circle" cx="40" cy="40" r="30" stroke="url(#ldrArcCheck)" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path className="success-check" d="M26 40 L36 50 L54 30" stroke="url(#ldrArcCheck)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}
