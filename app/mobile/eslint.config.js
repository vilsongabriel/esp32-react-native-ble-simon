// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")
const prettier = require("eslint-plugin-prettier")

module.exports = defineConfig([
  expoConfig,
  {
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
      semi: ["error", "never"],
    },
  },
  {
    ignores: ["dist/*", "node_modules/*", ".expo/*"],
  },
])
