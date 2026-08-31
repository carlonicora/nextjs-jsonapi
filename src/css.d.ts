// TypeScript 6 reports TS2882 for side-effect CSS imports that have no type
// declaration. Bundlers (Next/webpack/turbopack) handle these at build time;
// the compiler only needs to know the module exists.
declare module "*.css";
