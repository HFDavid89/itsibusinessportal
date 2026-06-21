import * as React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    '[background:linear-gradient(135deg,rgb(var(--primary))_0%,rgb(var(--primary)/0.85)_100%)] text-primary-foreground [box-shadow:0_1px_2px_0_rgb(var(--primary)/0.3),inset_0_1px_0_0_rgb(255_255_255/0.08)] hover:[box-shadow:0_4px_12px_0_rgb(var(--primary)/0.35),inset_0_1px_0_0_rgb(255_255_255/0.1)] hover:-translate-y-px active:translate-y-0 focus-visible:ring-primary',
  secondary:
    'bg-surface border border-border text-foreground [box-shadow:var(--shadow-xs)] hover:bg-surface-raised hover:[box-shadow:var(--shadow-sm)] hover:-translate-y-px active:translate-y-0 focus-visible:ring-muted',
  accent:
    '[background:linear-gradient(135deg,rgb(var(--accent))_0%,rgb(var(--accent)/0.85)_100%)] text-accent-foreground [box-shadow:0_1px_2px_0_rgb(var(--accent)/0.3)] hover:[box-shadow:0_4px_12px_0_rgb(var(--accent)/0.35)] hover:-translate-y-px active:translate-y-0 focus-visible:ring-accent',
  danger:
    'bg-danger text-white [box-shadow:0_1px_2px_0_rgb(220_38_38/0.3)] hover:bg-danger/90 hover:[box-shadow:0_4px_12px_0_rgb(220_38_38/0.35)] hover:-translate-y-px active:translate-y-0 focus-visible:ring-danger',
  ghost:
    'bg-transparent text-foreground hover:bg-surface-raised focus-visible:ring-muted',
  outline:
    'border border-border bg-transparent text-foreground hover:bg-surface-raised [box-shadow:var(--shadow-xs)] focus-visible:ring-muted',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold rounded-app',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50 disabled:![transform:none]',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    />
  );
};
