/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'Cairo', 'sans-serif'],
        display: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      colors: {
        bridal: {
          bg: 'rgb(var(--bridal-bg-rgb) / <alpha-value>)',
          cream: 'rgb(var(--bridal-cream-rgb) / <alpha-value>)',
          surface: 'rgb(var(--bridal-surface-rgb) / <alpha-value>)',
          border: 'rgb(var(--bridal-border-rgb) / <alpha-value>)',
          rose: 'rgb(var(--bridal-rose-rgb) / <alpha-value>)',
          blush: 'rgb(var(--bridal-blush-rgb) / <alpha-value>)',
          roseLight: 'rgb(var(--bridal-rose-light-rgb) / <alpha-value>)',
          roseDark: 'rgb(var(--bridal-rose-dark-rgb) / <alpha-value>)',
          gold: 'rgb(var(--bridal-gold-rgb) / <alpha-value>)',
          amber: 'rgb(var(--bridal-amber-rgb) / <alpha-value>)',
          goldLight: 'rgb(var(--bridal-gold-light-rgb) / <alpha-value>)',
          sage: 'rgb(var(--bridal-sage-rgb) / <alpha-value>)',
          sageLight: 'rgb(var(--bridal-sage-light-rgb) / <alpha-value>)',
          sageDark: 'rgb(var(--bridal-sage-dark-rgb) / <alpha-value>)',
          charcoal: 'rgb(var(--bridal-charcoal-rgb) / <alpha-value>)',
          mauve: 'rgb(var(--bridal-mauve-rgb) / <alpha-value>)',
        }
      },
      boxShadow: {
        'bridal': 'var(--bridal-shadow)',
        'bridal-lg': 'var(--bridal-shadow-lg)',
        'bridal-inner': 'inset 0 2px 4px 0 rgba(216, 140, 154, 0.08)',
      }
    },
  },
  plugins: [],
}
