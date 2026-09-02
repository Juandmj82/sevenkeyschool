// Purge-based build so the site ships only the Tailwind utility classes it
// actually uses, instead of the ~600KB unpurged framework the old
// unpkg.com CDN link served on every page load.
//
// Solo coming-soon.html (página legada, noindex) sigue usando Tailwind.
// La landing (index.html) usa su propio sistema de diseño en css/styles.css.
//
// To rebuild after adding new Tailwind classes to coming-soon.html:
// npm install && npm run build:css
module.exports = {
  mode: 'jit',
  purge: [
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
