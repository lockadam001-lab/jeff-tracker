/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f0f0d',
        surface: '#161614',
        surface2: '#1c1b19',
        border: '#2e2d2b',
        primary: '#4fa3ae',
        success: '#6daa45',
        danger: '#d16374',
        warn: '#e8a034',
        muted: '#7a7977',
      },
      fontFamily: { mono: ['JetBrains Mono', 'monospace'] },
    },
  },
  plugins: [],
}
