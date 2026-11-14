'use client';

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TooltipProps {
  content: string;
  term?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, term, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center group cursor-help"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
      role="tooltip"
      aria-label={content}
    >
      {children ? (
        children
      ) : (
        <span className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800">
          {term && <span className="underline decoration-dotted underline-offset-2">{term}</span>}
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
        </span>
      )}

      {isVisible && (
        <span
          className={cn(
            'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-900 text-white text-xs rounded-lg shadow-lg pointer-events-none transition-all duration-150 ease-out border border-slate-800 text-left leading-relaxed font-normal',
            className
          )}
        >
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
}

// Built-in glossaries
export const GLOSSARY = {
  MRV: 'Measurement, Reporting, and Verification: A systematic protocol to quantify, document, and independently audit environmental metrics using verifiable sensor, satellite, and lab data.',
  CI: 'Confidence Interval (95% CI): The calculated range around the estimated stock within which the true value is expected to lie with 95% probability, explicitly capturing model and sensor variance.',
  PROVENANCE: 'Cryptographic data lineage tracing every estimate back through model weights, lab calibrations, and raw IoT/satellite sensor packets.',
  MPIW: 'Mean Prediction Interval Width: Average width of the 95% uncertainty band in t C/ha; narrower intervals indicate higher predictive confidence.',
  PICP: 'Prediction Interval Coverage Probability: Empirical percentage of actual lab core measurements that fall inside the model’s predicted 95% uncertainty interval.',
  ESTIMATED_STOCK: 'Estimated Carbon Stock: Model-derived organic carbon density per hectare (t C/ha). Strictly demo data, not verified carbon credits.',
  ADAPTIVE_SAMPLING: 'Active learning approach that dispatches costly physical soil core sampling specifically to sites with highest model uncertainty to maximize information gain.',
};
