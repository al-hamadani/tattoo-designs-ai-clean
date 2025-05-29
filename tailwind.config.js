/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        // Custom Colors matching our design system
        colors: {
          black: '#0A0A0A',
          white: '#FFFFFF',
          blue: {
            50: '#E6F0FF',
            100: '#CCE0FF',
            200: '#99C2FF',
            300: '#66A3FF',
            400: '#3385FF',
            500: '#0066FF',
            600: '#0052CC',
            700: '#003D99',
            800: '#002966',
            900: '#001433',
          },
          gray: {
            50: '#F5F5F5',
            100: '#E0E0E0',
            200: '#C4C4C4',
            300: '#A8A8A8',
            400: '#8C8C8C',
            500: '#666666',
            600: '#4A4A4A',
            700: '#2E2E2E',
            800: '#1A1A1A',
            900: '#0A0A0A',
          },
          success: '#00CC88',
          warning: '#FFB800',
          error: '#FF3366',
        },
        
        // Typography
        fontFamily: {
          sans: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"SF Pro Display"',
            '"Segoe UI"',
            'Roboto',
            'Oxygen',
            'Ubuntu',
            'sans-serif',
          ],
        },
        
        fontSize: {
          xs: ['0.75rem', { lineHeight: '1.4' }],      // 12px
          sm: ['0.875rem', { lineHeight: '1.5' }],     // 14px
          base: ['1rem', { lineHeight: '1.6' }],       // 16px
          lg: ['1.125rem', { lineHeight: '1.6' }],     // 18px
          xl: ['1.25rem', { lineHeight: '1.5' }],      // 20px
          '2xl': ['1.5rem', { lineHeight: '1.4' }],    // 24px
          '3xl': ['2rem', { lineHeight: '1.3' }],      // 32px
          '4xl': ['2.5rem', { lineHeight: '1.2' }],    // 40px
          '5xl': ['3rem', { lineHeight: '1.1' }],      // 48px
          '6xl': ['3.5rem', { lineHeight: '1.1' }],    // 56px
          '7xl': ['4.5rem', { lineHeight: '1.1' }],    // 72px
        },
        
        // Spacing based on 8px grid
        spacing: {
          '0.5': '0.125rem',  // 2px
          '1.5': '0.375rem',  // 6px
          '2.5': '0.625rem',  // 10px
          '3.5': '0.875rem',  // 14px
          '18': '4.5rem',     // 72px
          '22': '5.5rem',     // 88px
          '26': '6.5rem',     // 104px
          '30': '7.5rem',     // 120px
        },
        
        // Border Radius
        borderRadius: {
          'sm': '0.25rem',    // 4px
          'DEFAULT': '0.5rem', // 8px
          'md': '0.5rem',     // 8px
          'lg': '0.75rem',    // 12px
          'xl': '1rem',       // 16px
          '2xl': '1.5rem',    // 24px
          '3xl': '2rem',      // 32px
        },
        
        // Box Shadows
        boxShadow: {
          'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          'DEFAULT': '0 2px 8px rgba(0, 0, 0, 0.05)',
          'md': '0 4px 12px rgba(0, 0, 0, 0.08)',
          'lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
          'xl': '0 16px 48px rgba(0, 0, 0, 0.16)',
          '2xl': '0 24px 64px rgba(0, 0, 0, 0.20)',
          'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
          'none': 'none',
        },
        
        // Animations
        animation: {
          'fade-in': 'fadeIn 0.3s ease-out',
          'slide-in': 'slideIn 0.3s ease-out',
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'spin-slow': 'spin 3s linear infinite',
          'bounce-subtle': 'bounce 2s infinite',
        },
        
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          slideIn: {
            '0%': { opacity: '0', transform: 'translateX(-10px)' },
            '100%': { opacity: '1', transform: 'translateX(0)' },
          },
        },
        
        // Transitions
        transitionDuration: {
          '0': '0ms',
          '150': '150ms',
          '200': '200ms',
          '300': '300ms',
          '400': '400ms',
          '500': '500ms',
        },
        
        transitionTimingFunction: {
          'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
          'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
          'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
        
        // Z-index
        zIndex: {
          '1': '1',
          '2': '2',
          '5': '5',
          '60': '60',
          '70': '70',
          '80': '80',
          '90': '90',
          '100': '100',
        },
        
        // Backdrop Filters
        backdropBlur: {
          xs: '2px',
          sm: '4px',
          DEFAULT: '8px',
          md: '12px',
          lg: '16px',
          xl: '24px',
          '2xl': '40px',
        },
        
        // Custom utilities
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        },
        
        // Screen breakpoints
        screens: {
          'xs': '475px',
          'sm': '640px',
          'md': '768px',
          'lg': '1024px',
          'xl': '1280px',
          '2xl': '1536px',
        },
      },
    },
    plugins: [
      // Add line-clamp plugin if needed
     //require('@tailwindcss/line-clamp')
    ],
  }