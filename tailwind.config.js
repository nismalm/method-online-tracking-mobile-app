module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'barlow': ['Barlow-Regular'],
        'barlow-medium': ['Barlow-Medium'],
        'barlow-semibold': ['Barlow-SemiBold'],
        'barlow-bold': ['Barlow-Bold'],
        'barlow-extrabold': ['Barlow-ExtraBold'],
      },
      colors: {
        'brand-primary': '#e0fe66',
        'brand-secondary': '#c2e04f',
        'brand-dark': '#3c3c3c',
        'brand-darkest': '#040404',
        'brand-white': '#ffffff',
        'brand-border': '#e5e5e5',
        'brand-text-secondary': '#3c3c3c',
        'brand-text-light': '#666666',
      }
    }
  },
  plugins: [],
}

