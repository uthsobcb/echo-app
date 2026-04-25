/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./component/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        sky: {
          cloud:  '#D6EAFF',
          mist:   '#F0F7FF',
          day:    '#EEF6FF',
          blue:   '#5B9BF8',
          sun:    '#FFB347',
          navy:   '#1A2A4A',
          faded:  '#6B8CAE',
          edge:   '#C8DFF5',
        },
        night: {
          cloud:  '#1E2D50',
          space:  '#0A0E1A',
          mid:    '#131929',
          deep:   '#1C2540',
          moon:   '#7EB8FF',
          purple: '#C084FC',
          star:   '#E8F0FF',
          dim:    '#7A94C0',
          border: '#2A3A5C',
        },
      },
    },
  },
  plugins: [],
}
