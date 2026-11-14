import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import boundaries from '../scripts/eslint/app-boundaries.mjs';

function lint(code, filename) {
  return new Linter().verify(
    code,
    [
      {
        files: ['**/*.{ts,tsx}'],
        languageOptions: { parser: tseslint.parser },
        plugins: { architecture: { rules: { boundaries } } },
        rules: { 'architecture/boundaries': 'error' },
      },
    ],
    { filename: resolve(filename) },
  );
}

it.each([
  ["import './terrain/createTerrain'", 'src/jelly-oasis/main.ts'],
  ["import '../shared/rendering/RendererManager'", 'src/app/App.ts'],
  ["import '../shared/rendering/RendererManager'", 'src/jelly-oasis/main.ts'],
  ["import '../camera/CameraController'", 'src/core/scene/SceneManager.ts'],
  ["import './helpers'", 'src/shared/rendering/RendererManager.ts'],
])('allows local and shared dependencies: %s', (code, filename) => {
  expect(lint(code, filename)).toEqual([]);
});

it.each([
  ["import '../uriel/data'", 'src/jelly-oasis/main.ts'],
  ["export * from '../../uriel/data'", 'src/jelly-oasis/app/test.ts'],
  ["export { App } from '../app/App'", 'src/uriel/main.tsx'],
  ["import('../../viola/main')", 'src/shared/rendering/test.ts'],
  ["type App = import('../jelly-oasis/main').App", 'src/uriel/test.ts'],
  ["import '../jelly-oasis/main'", 'src/app/App.ts'],
])(
  'rejects cross-app dependencies and shared-to-app dependencies: %s',
  (code, filename) => {
    expect(lint(code, filename).map((message) => message.messageId)).toEqual([
      'boundary',
    ]);
  },
);
