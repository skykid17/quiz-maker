import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        'warm-sm': '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.03)',
        'warm': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 4px 6px -1px rgb(0 0 0 / 0.04)',
        'warm-md': '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 10px 15px -3px rgb(0 0 0 / 0.04)',
        'warm-lg': '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 20px 25px -5px rgb(0 0 0 / 0.04)',
      },
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#fafaf9',
          tertiary: '#f5f5f4',
        },
      },
    },
  },
  plugins: [],
}

export default config
