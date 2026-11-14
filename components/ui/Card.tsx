import React from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'subtle' | 'agri' | 'bluecarbon';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const variantStyles = {
    default: 'bg-white border border-slate-200/80 shadow-subtle',
    elevated: 'bg-white border border-slate-200 shadow-card hover:shadow-elevated transition-shadow duration-200',
    subtle: 'bg-slate-50/70 border border-slate-200/60',
    agri: 'bg-white border-l-4 border-l-emerald-600 border-slate-200 shadow-subtle',
    bluecarbon: 'bg-white border-l-4 border-l-teal-600 border-slate-200 shadow-subtle',
  };

  return (
    <div
      className={cn('rounded-xl p-5 transition-all', variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  title,
  subtitle,
  action,
  children,
}: {
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div>
        {title && <h3 className="font-semibold text-slate-900 text-base tracking-tight">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
