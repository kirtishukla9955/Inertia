/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base':     '#000000',
        'bg-surface':  'rgba(12,12,12,0.85)',
        'bg-elevated': 'rgba(22,22,22,0.90)',
        'accent-cyan':  '#00F0FF',
        'accent-amber': '#FFB800',
        'accent-red':   '#FF3B3B',
        'accent-green': '#00FF94',
        'text-primary': '#F0F0F0',
        'text-muted':   '#666680',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'scan':         'scan 2s linear infinite',
        'panel-pulse':  'panelPulse 4s ease-in-out infinite',
        'glow-pulse':   'glowPulse 2s ease-in-out infinite',
        'fade-up':      'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'digit-roll':   'digitRoll 0.3s cubic-bezier(0.16,1,0.3,1)',
        'edge-flash':   'edgeFlash 0.6s ease-out forwards',
        'ripple':       'ripple 0.8s ease-out forwards',
        'word-reveal':  'wordReveal 1.2s cubic-bezier(0.16,1,0.3,1) forwards',
        'intro-in':     'introIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        'intro-out':    'introOut 0.45s cubic-bezier(0.4,0,1,1) forwards',
        'marquee-left': 'marqueeLeft 20s linear infinite',
        'spin-slow':    'spin 8s linear infinite',
      },
      keyframes: {
        scan: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        panelPulse: {
          '0%,100%': { borderColor: 'rgba(255,255,255,0.07)' },
          '50%':     { borderColor: 'rgba(0,240,255,0.12)' },
        },
        glowPulse: {
          '0%,100%': { opacity: 1, transform: 'scale(1)' },
          '50%':     { opacity: 0.4, transform: 'scale(0.85)' },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        digitRoll: {
          from: { transform: 'translateY(20px)', opacity: 0 },
          to:   { transform: 'translateY(0)',    opacity: 1 },
        },
        edgeFlash: {
          '0%':   { boxShadow: 'inset 0 0 0 3px rgba(255,59,59,0.9)' },
          '60%':  { boxShadow: 'inset 0 0 0 3px rgba(255,59,59,0.4)' },
          '100%': { boxShadow: 'inset 0 0 0 0px rgba(255,59,59,0)' },
        },
        ripple: {
          '0%':   { transform: 'scale(0)', opacity: 0.6 },
          '100%': { transform: 'scale(4)', opacity: 0 },
        },
        wordReveal: {
          '0%':   { opacity: 0, filter: 'blur(24px)', transform: 'translateY(24px)' },
          '60%':  { filter: 'blur(3px)', opacity: 0.85 },
          '100%': { opacity: 1, filter: 'blur(0)', transform: 'translateY(0)' },
        },
        introIn: {
          from: { opacity: 0, filter: 'blur(36px)', transform: 'translateY(48px)' },
          to:   { opacity: 1, filter: 'blur(0)',    transform: 'translateY(0)' },
        },
        introOut: {
          from: { opacity: 1, filter: 'blur(0)',    transform: 'translateY(0)' },
          to:   { opacity: 0, filter: 'blur(24px)', transform: 'translateY(-20px)' },
        },
        marqueeLeft: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
