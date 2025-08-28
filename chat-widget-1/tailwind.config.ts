import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  				keyframes: {
			'accordion-down': {
				from: {
					height: '0'
				},
				to: {
					height: 'var(--radix-accordion-content-height)'
				}
			},
			'accordion-up': {
				from: {
					height: 'var(--radix-accordion-content-height)'
				},
				to: {
					height: '0'
				}
			},
			'message-slide-in': {
				from: {
					opacity: '0',
					transform: 'translateY(30px) scale(0.98)'
				},
				to: {
					opacity: '1',
					transform: 'translateY(0) scale(1)'
				}
			},
			'message-fade-in': {
				from: {
					opacity: '0',
					transform: 'translateY(10px)'
				},
				to: {
					opacity: '1',
					transform: 'translateY(0)'
				}
			},
			'message-bounce-in': {
				'0%': {
					opacity: '0',
					transform: 'scale(0.3) translateY(20px)'
				},
				'50%': {
					opacity: '1',
					transform: 'scale(1.05) translateY(0)'
				},
				'70%': {
					opacity: '1',
					transform: 'scale(0.9) translateY(0)'
				},
				'100%': {
					opacity: '1',
					transform: 'scale(1) translateY(0)'
				}
			}
		},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out',
			'message-slide-in': 'message-slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
			'message-fade-in': 'message-fade-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
			'message-bounce-in': 'message-bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
		},
      willChange: {
        'accordion': 'height',
      }
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        '.motion-reduce': {
          '@media (prefers-reduced-motion: reduce)': {
            '&': {
              animation: 'none',
              transition: 'none',
            },
          },
        },
        '.animation-optimize': {
          'will-change': 'transform, opacity',
          'backface-visibility': 'hidden',
          '-webkit-backface-visibility': 'hidden',
        },
      });
    },
  ],
  corePlugins: {
    willChange: true,
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
};
export default config;