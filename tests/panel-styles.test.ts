import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('project panel styles', () => {
  it('keeps the scan animation inside the panel scroll bounds', async () => {
    const stylesheet = await readFile(
      new URL('../src/styles/main.css', import.meta.url),
      'utf8',
    );
    const scanAnimation = stylesheet.match(
      /@keyframes panel-scan\s*\{(?<body>[\s\S]*?)\n\}/,
    );

    expect(scanAnimation?.groups?.body).toContain('background-position: 50% 100%');
    expect(scanAnimation?.groups?.body).not.toContain('transform:');
  });
});
