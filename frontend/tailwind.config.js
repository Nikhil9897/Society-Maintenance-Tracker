/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10192E',
        brass: '#C9A468',
        parchment: '#F6F4EF',
        slate: '#8A9088',
        obsidian: '#181818',
        blueprint: '#3A5A8C',
        status: {
          open: '#D97706',
          progress: '#2563EB',
          resolved: '#16A34A',
          overdue: '#DC2626',
          closed: '#6B7280',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.6rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.05' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['clamp(2.5rem, 8vw, 6rem)', { lineHeight: '1' }],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-expo': 'cubic-bezier(0.7, 0, 0.84, 0)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(16,25,46,0.08), 0 4px 16px rgba(16,25,46,0.06)',
        'hover': '0 4px 12px rgba(16,25,46,0.12), 0 16px 40px rgba(16,25,46,0.10)',
        'brass': '0 0 0 2px rgba(201,164,104,0.4)',
        'input': '0 0 0 2px rgba(58,90,140,0.25)',
      },
    },
  },
  plugins: [],
};
