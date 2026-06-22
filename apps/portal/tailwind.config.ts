import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background:       'rgb(var(--background) / <alpha-value>)',
        foreground:       'rgb(var(--foreground) / <alpha-value>)',
        surface:          'rgb(var(--surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--surface-raised) / <alpha-value>)',
        'surface-overlay':'rgb(var(--surface-overlay) / <alpha-value>)',
        primary:          'rgb(var(--primary) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--primary-foreground) / <alpha-value>)',
        accent:           'rgb(var(--accent) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--accent-foreground) / <alpha-value>)',
        border:           'rgb(var(--border) / <alpha-value>)',
        muted:            'rgb(var(--muted) / <alpha-value>)',
        success:          'rgb(var(--success) / <alpha-value>)',
        warning:          'rgb(var(--warning) / <alpha-value>)',
        danger:           'rgb(var(--danger) / <alpha-value>)',
        info:             'rgb(var(--info) / <alpha-value>)',
        'brand-black':    'rgb(var(--brand-black) / <alpha-value>)',
        'brand-navy':     'rgb(var(--brand-navy) / <alpha-value>)',
        'brand-yellow':   'rgb(var(--brand-yellow) / <alpha-value>)',
        'brand-purple':   'rgb(var(--brand-purple) / <alpha-value>)',
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        app:  'var(--radius)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl':'var(--radius-2xl)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        xs:   'var(--shadow-xs)',
        sm:   'var(--shadow-sm)',
        md:   'var(--shadow-md)',
        lg:   'var(--shadow-lg)',
        card: 'var(--shadow-card)',
        glow: 'var(--shadow-glow)',
      },
    },
  },
  plugins: [],
};

export default config;
