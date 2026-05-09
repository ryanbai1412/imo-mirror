import js from "@eslint/js";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    rules: {
      // Allow unused vars prefixed with _
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // Common in SvelteKit load() returns
      "@typescript-eslint/no-explicit-any": "error",
      // Allow empty functions (event handlers etc)
      "@typescript-eslint/no-empty-function": "off",
      // Project uses absolute paths — resolve() not needed
      "svelte/no-navigation-without-resolve": "off",
      // {@html} is used intentionally for rendered content
      "svelte/no-at-html-tags": "off",
      // Maps are used in local computation, not reactive state
      "svelte/prefer-svelte-reactivity": "off",
      // $state + $effect used for user-overridable defaults
      "svelte/prefer-writable-derived": "off",
      // Whitespace-control mustaches like {" "} are intentional
      "svelte/no-useless-mustaches": "off",
    },
  },
  {
    ignores: [
      ".svelte-kit/",
      "build/",
      "node_modules/",
      "static/js/",
      "scripts/",
    ],
  }
);
