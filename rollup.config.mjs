import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
//import { terser } from "@rollup/plugin-terser";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "cjs",
    sourcemap: true,
  },
  external: [
    "canvas",
    "@elgato/streamdeck"
  ],
  plugins: [
    resolve({
      preferBuiltins: true
    }),
    commonjs(),

  ],
  onwarn: (warning, warn) => {
    if (warning.code === "CIRCULAR_DEPENDENCY") return;
    warn(warning);
  }
};