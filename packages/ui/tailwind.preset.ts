import type { Config } from 'tailwindcss';

export const itsiPreset: Pick<Config, 'theme'> = {
  theme: {
    extend: {
      colors: {
        background:           'rgb(var(--background) / <alpha-value>)',
        foreground:           'rgb(var(--foreground) / <alpha-value>)',
        surface:              'rgb(var(--surface) / <alpha-value>)',
        'surface-raised':     'rgb(var(--surface-raised) / <alpha-value>)',
        'surface-overlay':    'rgb(var(--surface-overlay) / <alpha-value>)',
        primary:              'rgb(var(--primary) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--primary-foreground) / <alpha-value>)',
        accent:               'rgb(var(--accent) / <alpha-value>)',
        'accent-foreground':  'rgb(var(--accent-foreground) / <alpha-value>)',
        muted:                'rgb(var(--muted) / <alpha-value>)',
        border:               'rgb(var(--border) / <alpha-value>)',
        success:              'rgb(var(--success) / <alpha-value>)',
        warning:              'rgb(var(--warning) / <alpha-value>)',
        danger:               'rgb(var(--danger) / <alpha-value>)',
        info:                 'rgb(var(--info) / <alpha-value>)',
      },
      borderRadius: {
        app:      'var(--radius)',
        'app-sm': 'var(--radius-sm)',
        'app-lg': 'var(--radius-lg)',
        'app-xl': 'var(--radius-xl)',
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'sans-serif'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        xs:    'var(--shadow-xs)',
        sm:    'var(--shadow-sm)',
        md:    'var(--shadow-md)',
        lg:    'var(--shadow-lg)',
        xl:    'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        glow:  'var(--shadow-glow)',
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--accent) / 0.85))',
        'gradient-surface': 'linear-gradient(to bottom right, rgb(var(--surface)), rgb(var(--surface-raised)))',
      },
      keyframes: {
        'fade-in':  { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        'fade-in':  'fade-in 0.2s ease forwards',
        'slide-up': 'slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
};
