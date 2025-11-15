/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Gallery Palette - Elegant Functionalism
        primary: {
          50: '#F5F7FF',
          100: '#EBF0FF',
          200: '#D6E0FF',
          300: '#A3BFFF',
          400: '#5C8FFF',
          500: '#2666FF', // 主蓝色
          600: '#1E52CC',
          700: '#173D99',
          800: '#0F2966',
          900: '#081533',
        },
        accent: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7', // 主紫色
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
        },
        gallery: {
          black: '#111111',
          charcoal: '#181818',
          ink: '#222222',
          white: '#F8F8F8',
          lighter: '#FAFAFA',
          line: '#E0E0E0',
          divider: '#D0D0D0',
        },
        success: '#10B981',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}