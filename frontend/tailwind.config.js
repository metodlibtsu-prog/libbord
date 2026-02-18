/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        'dark-bg': '#0D1117',
        'dark-card': '#161B22',
        'dark-border': '#30363D',
        'dark-text': '#E6EDF3',
        'dark-text-secondary': '#8B949E',

        // Gradient colors
        'gradient-cyan': '#00D4FF',
        'gradient-purple': '#7B2FBE',
        'gradient-pink': '#FF006E',

        // Channel colors (updated for gradients)
        channel: {
          website: '#00D4FF',
          'e-library': '#10B981',
          catalog: '#F59E0B',
          telegram: '#0EA5E9',
          vk: '#7B2FBE',
          'mobile-app': '#FF006E',
          other: '#8B949E',
        },
      },
      backgroundImage: {
        'gradient-premium': 'linear-gradient(135deg, #00D4FF 0%, #7B2FBE 50%, #FF006E 100%)',
        'gradient-premium-hover': 'linear-gradient(135deg, #00D4FF 0%, #7B2FBE 40%, #FF006E 90%)',
        'gradient-cyan': 'linear-gradient(135deg, #00D4FF 0%, #0EA5E9 100%)',
        'gradient-purple': 'linear-gradient(135deg, #7B2FBE 0%, #9333EA 100%)',
        'gradient-pink': 'linear-gradient(135deg, #FF006E 0%, #EC4899 100%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.5)',
        'glow-purple': '0 0 20px rgba(123, 47, 190, 0.5)',
        'glow-pink': '0 0 20px rgba(255, 0, 110, 0.5)',
        'premium': '0 4px 24px rgba(0, 212, 255, 0.15)',
        'premium-lg': '0 8px 32px rgba(0, 212, 255, 0.2)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
