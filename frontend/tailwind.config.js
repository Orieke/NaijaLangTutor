/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ohafia Theme - Inspired by War Dance, Bravery, and Nigerian Earth
        ohafia: {
          // Primary - Bold Terracotta (War Dance Energy)
          primary: {
            DEFAULT: '#ed5a1c', // Default when using bg-ohafia-primary
            50: '#fef3ed',
            100: '#fde4d4',
            200: '#fac6a8',
            300: '#f6a171',
            400: '#f07138',
            500: '#ed5a1c', // Main brand color
            600: '#de4012',
            700: '#b82e11',
            800: '#932616',
            900: '#772315',
            950: '#400f09',
          },
          // Secondary - Deep Forest Green (Nigerian landscape)
          secondary: {
            DEFAULT: '#22c527', // Default when using bg-ohafia-secondary
            50: '#f0fdf0',
            100: '#dcfcdc',
            200: '#bbf7bc',
            300: '#86ef89',
            400: '#4ade4e',
            500: '#22c527',
            600: '#16a31a',
            700: '#158018',
            800: '#166518',
            900: '#145316',
            950: '#052e08',
          },
          // Accent - Royal Gold (Ohafia Pride)
          accent: {
            DEFAULT: '#eab308', // Default when using bg-ohafia-accent
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            400: '#facc15',
            500: '#eab308', // Gold accent
            600: '#ca8a04',
            700: '#a16207',
            800: '#854d0e',
            900: '#713f12',
            950: '#422006',
          },
          // Neutral - Warm Sand
          sand: {
            DEFAULT: '#d4ae82',
            50: '#fdfcfb',
            100: '#faf7f2',
            200: '#f5ede0',
            300: '#ecdcc6',
            400: '#e0c5a3',
            500: '#d4ae82',
            600: '#c4936a',
            700: '#a47552',
            800: '#866048',
            900: '#6e503d',
            950: '#3a2a1f',
          },
          // Dark - Deep Brown (Traditional)
          earth: {
            DEFAULT: '#b37b59',
            50: '#faf6f3',
            100: '#f3ebe3',
            200: '#e5d4c5',
            300: '#d4b69e',
            400: '#c19476',
            500: '#b37b59',
            600: '#a5684d',
            700: '#8a5341',
            800: '#70453a',
            900: '#5c3b32',
            950: '#311d19',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'ohafia': '0 4px 14px 0 rgba(237, 90, 28, 0.2)',
        'ohafia-lg': '0 10px 25px -3px rgba(237, 90, 28, 0.3)',
      },
    },
  },
  plugins: [],
};
