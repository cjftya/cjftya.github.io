import { isAbsolute, relative, resolve, sep } from 'node:path';
import siteEntries from '../../config/siteEntries.json' with { type: 'json' };

const sourceRoot = resolve(import.meta.dirname, '../../src');
const standaloneApps = new Set(
  Object.values(siteEntries)
    .filter((entry) => entry.startsWith('projects/'))
    .map((entry) => entry.split('/')[1]),
);

function owner(filename) {
  const path = relative(sourceRoot, filename);
  if (path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)) return null;
  const directory = path.split(sep)[0];
  if (directory === 'shared') return 'shared';
  return standaloneApps.has(directory) ? directory : 'portal';
}

/** Shared code cannot depend on apps, and apps cannot depend on each other. */
export default {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      boundary:
        '{{source}} cannot import {{target}}. Keep app code local or extract genuinely shared code into src/shared.',
    },
  },
  create(context) {
    const filename = context.filename;
    const source = owner(filename);
    function check(node) {
      if (!source || typeof node?.value !== 'string' || !node.value.startsWith('.'))
        return;
      const target = owner(resolve(filename, '..', node.value));
      if (target && target !== source && target !== 'shared') {
        context.report({ node, messageId: 'boundary', data: { source, target } });
      }
    }
    return {
      ImportDeclaration: (node) => check(node.source),
      ExportNamedDeclaration: (node) => check(node.source),
      ExportAllDeclaration: (node) => check(node.source),
      ImportExpression: (node) => check(node.source),
      TSImportType: (node) => check(node.source),
    };
  },
};
