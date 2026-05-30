import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c8dbed',
          300: '#a2c1df',
          400: '#759fcc',
          500: '#537eb7',
          600: '#40649c',
          700: '#35517f',
          800: '#2f456a',
          900: '#1b253b', // Dark Blue Primary
          950: '#101726',
        },
        warning: '#ef4444', // Red accent
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
