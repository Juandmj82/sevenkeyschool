// Purge-based build so the site ships only the Tailwind utility classes it
// actually uses, instead of the ~600KB unpurged framework the old
// unpkg.com CDN link served on every page load.
//
// To rebuild after adding new Tailwind classes to index.html or
// coming-soon.html: npm install && npm run build:css
module.exports = {
  mode: 'jit',
  purge: [
    './index.html',
    './coming-soon.html',
  ],
  darkMode: false,
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
