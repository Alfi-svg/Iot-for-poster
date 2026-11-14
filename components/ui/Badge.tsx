import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Ecosystem } from '@/types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'agriculture' | 'blue_carbon' | 'warning' | 'critical' | 'success' | 'outline' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200',
    agriculture: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    blue_carbon: 'bg-teal-50 text-teal-800 border border-teal-200/80',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    critical: 'bg-red-50 text-red-800 border border-red-200',
    success: 'bg-green-50 text-green-800 border border-green-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    outline: 'bg-transparent text-slate-700 border border-slate-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full tracking-tight transition-colors',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function EcosystemBadge({ ecosystem }: { ecosystem: Ecosystem }) {
  if (ecosystem === 'agriculture') {
    return (
      <Badge variant="agriculture" size="sm">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
        Agriculture (SOC)
      </Badge>
    );
  }
  return (
    <Badge variant="blue_carbon" size="sm">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block" />
      Blue Carbon (Coastal)
    </Badge>
  );
}
