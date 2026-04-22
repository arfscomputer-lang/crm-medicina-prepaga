import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F1117',
        card: '#181A23',
        border: '#2A2D3A',
        accent: '#5B8DEF',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        sana: '#34D399',
        confort: '#FBBF24',
        excellent: '#8B5CF6',
        adultos: '#F97316',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
