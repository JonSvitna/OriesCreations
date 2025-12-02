/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/**/*.{html,js}",
    "./client/src/**/*.{html,js}",
    "./client/index.html",
  ],
  theme: {
    extend: {
      colors: {
        fantasy: {
          gold: '#d4af37',
          bronze: '#cd7f32',
          silver: '#c0c0c0',
          dark: '#1a1a2e',
          darker: '#0f0f1a',
          purple: '#4a0e4e',
          crimson: '#8b0000',
        }
      },
      fontFamily: {
        fantasy: ['Cinzel', 'serif'],
        body: ['Lora', 'serif'],
      },
      backgroundImage: {
        'parchment': "url('/images/parchment-bg.jpg')",
        'castle': "url('/images/castle-bg.jpg')",
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #d4af37, 0 0 10px #d4af37' },
          '100%': { boxShadow: '0 0 20px #d4af37, 0 0 30px #d4af37' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
