/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      boxShadow: {
        'card-soft': '0px 6px 12px rgba(14, 61, 122, 0.08)',
        'history-button': '0px 4px 6px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};
