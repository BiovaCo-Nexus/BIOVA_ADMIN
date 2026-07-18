import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
			},
			colors: {
				red: { 50: '#fef1f2', 100: '#fee5e6', 200: '#fccbcd', 300: '#f9a6aa', 400: '#f3797e', 500: '#f3797e', 600: '#e05259', 700: '#bd393f', 800: '#9d3237', 900: '#832e32' },
				orange: { 50: '#fef1f2', 100: '#fee5e6', 200: '#fccbcd', 300: '#f9a6aa', 400: '#f3797e', 500: '#f3797e', 600: '#e05259', 700: '#bd393f', 800: '#9d3237', 900: '#832e32' },
				yellow: { 50: '#fef1f2', 100: '#fee5e6', 200: '#fccbcd', 300: '#f9a6aa', 400: '#f3797e', 500: '#f3797e', 600: '#e05259', 700: '#bd393f', 800: '#9d3237', 900: '#832e32' },
				green: { 50: '#f0f5ff', 100: '#e4edff', 200: '#cdddff', 300: '#98BDFF', 400: '#75a3ff', 500: '#7DA0FA', 600: '#346dfa', 700: '#2053e6', 800: '#1e43ba', 900: '#1d3b94' },
				emerald: { 50: '#f0f5ff', 100: '#e4edff', 200: '#cdddff', 300: '#98BDFF', 400: '#75a3ff', 500: '#7DA0FA', 600: '#346dfa', 700: '#2053e6', 800: '#1e43ba', 900: '#1d3b94' },
				cyan: { 50: '#f0f5ff', 100: '#e4edff', 200: '#cdddff', 300: '#98BDFF', 400: '#75a3ff', 500: '#7DA0FA', 600: '#346dfa', 700: '#2053e6', 800: '#1e43ba', 900: '#1d3b94' },
				teal: { 50: '#f0f5ff', 100: '#e4edff', 200: '#cdddff', 300: '#98BDFF', 400: '#75a3ff', 500: '#7DA0FA', 600: '#346dfa', 700: '#2053e6', 800: '#1e43ba', 900: '#1d3b94' },
				blue: { 50: '#eef2fc', 100: '#e0e7fa', 200: '#c5d3f6', 300: '#9bb4f0', 400: '#6d8de7', 500: '#4B49AC', 600: '#393693', 700: '#2d2a75', 800: '#25235f', 900: '#211f4e' },
				indigo: { 50: '#eef2fc', 100: '#e0e7fa', 200: '#c5d3f6', 300: '#9bb4f0', 400: '#6d8de7', 500: '#4B49AC', 600: '#393693', 700: '#2d2a75', 800: '#25235f', 900: '#211f4e' },
				purple: { 50: '#f2f2fd', 100: '#e7e7fa', 200: '#d5d4f6', 300: '#b8b7f0', 400: '#9795e7', 500: '#7978E9', 600: '#5c5bd6', 700: '#4b4ab3', 800: '#3f3f91', 900: '#363574' },
				violet: { 50: '#f2f2fd', 100: '#e7e7fa', 200: '#d5d4f6', 300: '#b8b7f0', 400: '#9795e7', 500: '#7978E9', 600: '#5c5bd6', 700: '#4b4ab3', 800: '#3f3f91', 900: '#363574' },
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-20px)' },
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 6s ease-in-out infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
