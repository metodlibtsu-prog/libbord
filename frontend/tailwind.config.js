/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        channel: {
          website: '#3B82F6',
          'e-library': '#10B981',
          catalog: '#F59E0B',
          telegram: '#0EA5E9',
          vk: '#6366F1',
          'mobile-app': '#EC4899',
          other: '#6B7280',
        },
      },
    },
  },
  plugins: [],
}
