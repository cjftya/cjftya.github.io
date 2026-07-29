import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { parseProjectCollection } from '../src/data/validation';

describe('public/data/projects.json', () => {
  it('matches the runtime project schema', async () => {
    const fileUrl = new URL('../public/data/projects.json', import.meta.url);
    const input: unknown = JSON.parse(await readFile(fileUrl, 'utf8'));

    const collection = parseProjectCollection(input);

    expect(collection.projects).toHaveLength(1);
    expect(collection.projects[0]?.id).toBe('viola');
  });
});
