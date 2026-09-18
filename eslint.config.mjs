import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["desktop-app/src/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "desktop-app/main.js",
    "desktop-app/preload.js",
    "desktop-app/dist/**",
    "desktop-app/release/**",
    "desktop-app/node_modules/**",
  ]),
]);

export default eslintConfig;
