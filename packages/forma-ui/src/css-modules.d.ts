// The types of a CSS Module import: the class names the module declares, as the strings the build generates. The
// build tool is Vite, but declaring this here keeps the components free of `/// <reference types="vite/client" />`,
// which would also pull the types of every other Vite asset import into the package.
declare module '*.module.css' {
  const classNames: { readonly [className: string]: string }
  export default classNames
}
