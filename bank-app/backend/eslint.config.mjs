import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ignores: ["run-migrations.js", "dist/"]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
