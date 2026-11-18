import type { JSX as ReactJSX } from "react";

// React 19's types no longer expose a global `JSX` namespace. Several files use
// `JSX.Element`, so map the global name onto React's own JSX namespace.
declare global {
  namespace JSX {
    type Element = ReactJSX.Element;
    type ElementType = ReactJSX.ElementType;
    type IntrinsicElements = ReactJSX.IntrinsicElements;
  }
}

export {};
