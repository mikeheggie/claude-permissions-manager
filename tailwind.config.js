/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic theme colors (respond to light/dark via CSS variables)
        bg: {
          DEFAULT: 'var(--color-bg)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
        },
        surface: 'var(--color-surface)',
        border: {
          DEFAULT: 'var(--color-border)',
          hover: 'var(--color-border-hover)',
        },
        foreground: {
          DEFAULT: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        // Category Colors - Vibrant & Modern
        category: {
          allow: {
            DEFAULT: 'var(--color-allow)',
            dim: 'var(--color-allow-dim)',
            border: 'var(--color-allow-border)',
          },
          deny: {
            DEFAULT: 'var(--color-deny)',
            dim: 'var(--color-deny-dim)',
            border: 'var(--color-deny-border)',
          },
          ask: {
            DEFAULT: 'var(--color-ask)',
            dim: 'var(--color-ask-dim)',
            border: 'var(--color-ask-border)',
          },
        },
        // Accent Colors - Claude Orange
        accent: {
          primary: 'rgb(var(--color-accent-primary) / <alpha-value>)',
          'primary-hover': 'rgb(var(--color-accent-primary-hover) / <alpha-value>)',
          secondary: 'rgb(var(--color-accent-secondary) / <alpha-value>)',
          glow: 'var(--color-accent-glow)',
        },
        // JSON Syntax Highlighting Colors
        json: {
          key: 'var(--json-key)',
          string: 'var(--json-string)',
          punctuation: 'var(--json-punctuation)',
          'line-number': 'var(--json-line-number)',
        },
      },
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'glow': 'var(--shadow-glow)',
        'glow-orange': '0 0 20px rgba(218, 119, 86, 0.3)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      typography: {
        DEFAULT: {
          css: {
            // Reduce spacing by ~25%
            p: {
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            h2: {
              marginTop: '1.5em',
              marginBottom: '0.5em',
            },
            h3: {
              marginTop: '1.2em',
              marginBottom: '0.4em',
            },
            h4: {
              marginTop: '1em',
              marginBottom: '0.3em',
            },
            ul: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            ol: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            li: {
              marginTop: '0.2em',
              marginBottom: '0.2em',
            },
            blockquote: {
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            // Inline code styling
            code: {
              backgroundColor: '#f5f5f5',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '400',
              fontSize: '0.875em',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            // Code blocks
            pre: {
              backgroundColor: '#f5f5f5',
              marginTop: '0.75em',
              marginBottom: '0.75em',
              borderRadius: '0.5rem',
              border: '1px solid #e5e5e5',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              borderRadius: '0',
            },
          },
        },
        invert: {
          css: {
            code: {
              backgroundColor: '#1e293b',
            },
            pre: {
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
            },
          },
        },
        lg: {
          css: {
            h2: {
              marginBottom: '0.7777em',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
