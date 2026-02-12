/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark theme colors from PRD
        background: {
          primary: '#18181b',   // zinc-900
          secondary: '#27272a', // zinc-800
          tertiary: '#3f3f46',  // zinc-700
        },
        text: {
          primary: '#f1f5f9',   // slate-100
          secondary: '#cbd5e1', // slate-300
          tertiary: '#94a3b8',  // slate-400
        },
        border: {
          primary: '#3f3f46',   // zinc-700
          secondary: '#52525b', // zinc-600
        },
        accent: {
          cost: '#4ade80',      // green-400
          sidechain: '#fbbf24', // amber-500
          warning: '#f87171',   // red-400
          primary: '#3b82f6',   // blue-500
        },
      },
    },
  },
  plugins: [],
}
