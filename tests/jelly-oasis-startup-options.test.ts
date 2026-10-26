import { describe, expect, it } from 'vitest';
import { readStartupOptions } from '../src/jelly-oasis/startupOptions';

describe('Jelly Oasis startup options', () => {
  it('keeps the approved production scene even with inspection overrides in the URL', () => {
    const { query: defaultQuery, ...defaults } = readStartupOptions('');
    expect(defaultQuery.size).toBe(0);
    const { query, ...overridden } = readStartupOptions(
      '?world=320&art=b&cliff=blockout&ruin=blockout&tree=blockout' +
        '&pond=blockout&crystal=blockout&aesthetic=baseline&sacred=baseline' +
        '&water=deep&vegetation=off&composition=b&scenery=off&meadow=b',
    );
    expect(overridden).toEqual(defaults);
    expect(defaults).toMatchObject({
      debugEnabled: false,
      config: { size: 224, artRelief: 1 },
      cliffDetail: true,
      ruinDetail: true,
      treeDetail: true,
      pondDetail: 'v2',
      crystalDetail: true,
      aesthetic: { sacred: true, tree: true, pond: true, cliff: true, water: 'soft' },
      vegetation: 'density-a',
      composition: 'a',
      scenery: 'a',
      meadow: 'a',
    });
    expect(query.get('world')).toBe('320');
  });

  it.each([
    ['?debug', false],
    ['?debug=false', false],
    ['', true],
  ])(
    'enables inspection by flag presence or development mode: %s / %s',
    (flag, dev) => {
      const options = readStartupOptions(
        `${flag}${flag ? '&' : '?'}world=192&art=b&vegetation=density-b` +
          '&composition=b&scenery=b&meadow=b&crystal=blockout',
        dev,
      );
      expect(options).toMatchObject({
        debugEnabled: true,
        config: { size: 192, artRelief: 2 },
        crystalDetail: false,
        vegetation: 'density-b',
        composition: 'b',
        scenery: 'b',
        meadow: 'b',
      });
    },
  );

  it.each([
    [
      'cliff=blockout&ruin=blockout&tree=blockout&pond=blockout',
      {
        cliffDetail: false,
        ruinDetail: false,
        treeDetail: false,
        pondDetail: false,
      },
    ],
    ['pond=detail', { pondDetail: true, aesthetic: { pond: true } }],
    ['pond=detail-v2', { pondDetail: 'v2', aesthetic: { pond: false } }],
    ['tree=detail&cliff=detail', { aesthetic: { tree: false, cliff: false } }],
    ['cliff=detail-v1', { aesthetic: { cliff: false } }],
    [
      'aesthetic=baseline&sacred=baseline',
      {
        aesthetic: {
          sacred: false,
          tree: false,
          pond: false,
          cliff: false,
          water: undefined,
        },
      },
    ],
    [
      'aesthetic=baseline&tree=refined&pond=refined&cliff=refined&water=deep',
      {
        aesthetic: { sacred: true, tree: true, pond: true, cliff: true, water: 'deep' },
      },
    ],
    ['water=baseline', { aesthetic: { water: undefined } }],
    ['aesthetic=baseline&water=soft', { aesthetic: { water: 'soft' } }],
    [
      'vegetation=off&composition=off&scenery=off&meadow=off',
      {
        vegetation: 'off',
        composition: 'off',
        scenery: 'off',
        meadow: 'off',
      },
    ],
  ])('preserves inspection variant precedence: %s', (search, expected) => {
    expect(readStartupOptions(`?debug&${search}`)).toMatchObject(expected);
  });

  it('falls back for unknown values and keeps the first repeated URL value', () => {
    const { query: defaultQuery, ...defaults } = readStartupOptions('?debug');
    const { query: unknownQuery, ...unknown } = readStartupOptions(
      '?debug&world=unknown&art=unknown&cliff=unknown&ruin=unknown&tree=unknown' +
        '&pond=unknown&crystal=unknown&aesthetic=unknown&water=unknown' +
        '&vegetation=unknown&composition=unknown&scenery=unknown&meadow=unknown',
    );
    expect(defaultQuery.has('debug')).toBe(true);
    expect(unknownQuery.get('world')).toBe('unknown');
    expect(unknown).toEqual(defaults);
    expect(
      readStartupOptions('?debug&world=192&world=320&pond=detail&pond=blockout'),
    ).toMatchObject({ config: { size: 192 }, pondDetail: true });
    // The original 320-metre inspection terrain deliberately ignores art relief.
    expect(
      readStartupOptions('?debug&world=320&art=b').config.artRelief,
    ).toBeUndefined();
  });
});
