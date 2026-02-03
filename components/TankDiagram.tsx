import React from 'react';
import { ThicknessMeasurements } from '../types';

interface TankDiagramProps {
  measurements: ThicknessMeasurements;
  onChange: (key: keyof ThicknessMeasurements, value: string) => void;
}

const MeasurementInput = ({ 
  value, 
  onChange, 
  top, 
  left, 
  label 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  top: string; 
  left: string; 
  label: string; 
}) => (
  <div 
    className="absolute flex flex-col items-center bg-white/90 p-1 rounded shadow-md border border-gray-200"
    style={{ top, left, transform: 'translate(-50%, -50%)' }}
  >
    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">{label}</span>
    <div className="flex items-center">
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-16 text-center font-mono font-bold text-blue-600 border-b border-blue-300 focus:outline-none focus:border-blue-600 bg-transparent text-sm"
        placeholder="0.00"
      />
      <span className="text-xs text-gray-400 ml-1">mm</span>
    </div>
  </div>
);

export const TankDiagram: React.FC<TankDiagramProps> = ({ measurements, onChange }) => {
  return (
    <div className="relative w-full max-w-sm mx-auto h-[450px] bg-slate-50 rounded-xl border border-slate-200 shadow-inner my-6 overflow-hidden">
        
      {/* Visual Tank Representation */}
      <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-xl p-8">
        {/* Main Body */}
        <path 
          d="M50,80 L50,320 A 50,30 0 0,0 150,320 L150,80 A 50,30 0 0,0 50,80" 
          fill="url(#tankGradient)" 
          stroke="#475569" 
          strokeWidth="2"
        />
        {/* Top Cap Lines for 3D effect */}
        <ellipse cx="100" cy="80" rx="50" ry="30" fill="#e2e8f0" stroke="#475569" strokeWidth="2" opacity="0.5" />
        <path d="M50,80 A 50,30 0 0,1 150,80" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="tankGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* Measure Lines */}
        <line x1="20" y1="50" x2="80" y2="80" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="20" y1="140" x2="50" y2="140" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="20" y1="200" x2="50" y2="200" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="20" y1="260" x2="50" y2="260" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="20" y1="350" x2="80" y2="320" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />

      </svg>

      {/* Interactive Inputs positioned absolutely */}
      
      {/* Top Head */}
      <MeasurementInput 
        top="12%" left="25%" label="Horné dno"
        value={measurements.topHead} 
        onChange={(v) => onChange('topHead', v)} 
      />

      {/* Shell Top */}
      <MeasurementInput 
        top="32%" left="20%" label="Plášť Vrch"
        value={measurements.shellTop} 
        onChange={(v) => onChange('shellTop', v)} 
      />

      {/* Shell Middle */}
      <MeasurementInput 
        top="48%" left="20%" label="Plášť Stred"
        value={measurements.shellMiddle} 
        onChange={(v) => onChange('shellMiddle', v)} 
      />

      {/* Shell Bottom */}
      <MeasurementInput 
        top="64%" left="20%" label="Plášť Spodok"
        value={measurements.shellBottom} 
        onChange={(v) => onChange('shellBottom', v)} 
      />

       {/* Bottom Head */}
       <MeasurementInput 
        top="85%" left="25%" label="Dolné dno"
        value={measurements.bottomHead} 
        onChange={(v) => onChange('bottomHead', v)} 
      />

    </div>
  );
};