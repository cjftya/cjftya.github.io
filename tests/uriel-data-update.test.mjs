import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESULT_URL, updateUrielData } from '../scripts/update-uriel-data.mjs';
import { loadBundledDraws, parseDrawCsv } from '../src/uriel/data';

const history = [
  '1,2002-12-07,10,23,29,33,37,40',
  '2,2002-12-14,9,13,21,25,32,42',
  '3,2002-12-21,11,16,19,21,27,31',
];
const results = [
  {
    ltEpsd: 1,
    ltRflYmd: '20021207',
    tm1WnNo: 10,
    tm2WnNo: 23,
    tm3WnNo: 29,
    tm4WnNo: 33,
    tm5WnNo: 37,
    tm6WnNo: 40,
    bnsWnNo: 16,
  },
  {
    ltEpsd: 2,
    ltRflYmd: '20021214',
    tm1WnNo: 9,
    tm2WnNo: 13,
    tm3WnNo: 21,
    tm4WnNo: 25,
    tm5WnNo: 32,
    tm6WnNo: 42,
    bnsWnNo: 2,
  },
  {
    ltEpsd: 3,
    ltRflYmd: '20021221',
    tm1WnNo: 11,
    tm2WnNo: 16,
    tm3WnNo: 19,
    tm4WnNo: 21,
    tm5WnNo: 27,
    tm6WnNo: 31,
    bnsWnNo: 30,
  },
];
const page = (round) => `<input type="hidden" id="opt_val" value="${round}">`;
const response = (list) =>
  new Response(
    JSON.stringify({ resultCode: null, resultMessage: null, data: { list } }),
  );

describe('Uriel official CSV refresh', () => {
  let directory;
  let filePath;
  const wait = vi.fn(async () => {});
  const now = new Date('2026-08-31T00:00:00Z');

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'uriel-update-'));
    filePath = join(directory, 'draws.csv');
    wait.mockClear();
  });
  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(directory, { recursive: true, force: true });
  });

  const fetchResults = (latest = 3, list = results) =>
    vi.fn(async (url) =>
      url === RESULT_URL ? new Response(page(latest)) : response(list),
    );

  it('adds missing results, preserves existing bytes and imports through the app parser', async () => {
    const original =
      '\uFEFF' + history[0].replace('2002-12-07', '"2002-12-07"') + '\r\n';
    await writeFile(filePath, original);
    const fetchImpl = fetchResults();
    const result = await updateUrielData({ filePath, fetchImpl, now, wait });
    const csv = await readFile(filePath, 'utf8');
    expect(result).toMatchObject({
      previousLatestRound: 1,
      latestRound: 3,
      addedRounds: [2, 3],
      written: true,
    });
    expect(csv.startsWith(original)).toBe(true);
    expect(parseDrawCsv(csv).map(({ round }) => round)).toEqual([1, 2, 3]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const api = new URL(fetchImpl.mock.calls[1][0]);
    expect(api.pathname).toBe('/lt645/selectPstLt645InfoNew.do');
    expect(Object.fromEntries(api.searchParams)).toEqual({
      srchLtEpsd: '3',
      srchDir: 'center',
    });
    expect(await readdir(directory)).toEqual(['draws.csv']);

    const repeat = fetchResults();
    expect(
      await updateUrielData({ filePath, fetchImpl: repeat, now, wait }),
    ).toMatchObject({ changed: false, written: false });
    expect(repeat).toHaveBeenCalledTimes(1);
    expect(await readFile(filePath, 'utf8')).toBe(csv);
  });

  it('fills a historical hole even when the latest round is already present', async () => {
    await writeFile(filePath, `${history[0]}\n${history[2]}\n`);
    const result = await updateUrielData({
      filePath,
      fetchImpl: fetchResults(),
      now,
      wait,
    });
    expect(result.addedRounds).toEqual([2]);
    expect(await readFile(filePath, 'utf8')).toBe(history.join('\n') + '\n');
  });

  it('makes multiple bounded requests when a result page does not contain every missing round', async () => {
    await writeFile(filePath, `${history[0]}\n`);
    const fetchImpl = vi.fn(async (url) => {
      if (url === RESULT_URL) return new Response(page(3));
      const round = Number(new URL(url).searchParams.get('srchLtEpsd'));
      return response([results[round - 1]]);
    });
    await updateUrielData({ filePath, fetchImpl, now, wait });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledWith(500);
    expect(await readFile(filePath, 'utf8')).toBe(history.join('\n') + '\n');
  });

  it('checks new results without changing the CSV', async () => {
    await writeFile(filePath, history[0]);
    const result = await updateUrielData({
      filePath,
      fetchImpl: fetchResults(),
      now,
      wait,
      check: true,
    });
    expect(result).toMatchObject({
      changed: true,
      written: false,
      addedRounds: [2, 3],
    });
    expect(await readFile(filePath, 'utf8')).toBe(history[0]);
  });

  it.each([
    ['malformed local row', `${history[0]}\n2,broken\n`],
    ['duplicate local round', `${history[0]}\n${history[0]}\n`],
    ['invalid local date', history[0].replace('2002-12-07', '2002-12-08')],
    ['empty CSV', ''],
  ])('does not fetch or change history for %s', async (_, original) => {
    await writeFile(filePath, original);
    const fetchImpl = fetchResults();
    await expect(updateUrielData({ filePath, fetchImpl, now, wait })).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(await readFile(filePath, 'utf8')).toBe(original);
    expect(await readdir(directory)).toEqual(['draws.csv']);
  });

  it.each([
    ['duplicate winning number', [{ ...results[2], tm2WnNo: 11 }]],
    ['number out of range', [{ ...results[2], tm6WnNo: 46 }]],
    ['missing winning number', [{ ...results[2], tm6WnNo: null }]],
    ['invalid date', [{ ...results[2], ltRflYmd: '20020230' }]],
    ['bonus among winning numbers', [{ ...results[2], bnsWnNo: 11 }]],
    ['unexpected round', [results[1]]],
    ['duplicate official round', [results[2], results[2]]],
    ['no published result', []],
    ['conflicting existing history', [results[2], { ...results[0], tm1WnNo: 12 }]],
  ])('keeps the complete source unchanged on %s', async (_, list) => {
    const original = `${history[0]}\r\n`;
    await writeFile(filePath, original);
    await expect(
      updateUrielData({ filePath, fetchImpl: fetchResults(3, list), now, wait }),
    ).rejects.toThrow();
    expect(await readFile(filePath, 'utf8')).toBe(original);
    expect(await readdir(directory)).toEqual(['draws.csv']);
  });

  it('does not commit an earlier successful batch when a later request fails', async () => {
    await writeFile(filePath, history[0]);
    const fetchImpl = vi.fn(async (url) => {
      if (url === RESULT_URL) return new Response(page(3));
      if (new URL(url).searchParams.get('srchLtEpsd') === '3')
        return response([results[2]]);
      return new Response('Unavailable', { status: 503 });
    });
    await expect(updateUrielData({ filePath, fetchImpl, now, wait })).rejects.toThrow(
      '503',
    );
    expect(fetchImpl).toHaveBeenCalledTimes(5);
    expect(await readFile(filePath, 'utf8')).toBe(history[0]);
  });

  it('rejects a changed official page, an HTML API error, and a stale latest round', async () => {
    await writeFile(filePath, history[0]);
    const badPage = vi.fn(async () => new Response('<html>maintenance</html>'));
    await expect(
      updateUrielData({ filePath, fetchImpl: badPage, now, wait }),
    ).rejects.toThrow('최신 회차');
    const badJson = vi.fn(
      async (url) =>
        new Response(url === RESULT_URL ? page(3) : '<html>blocked</html>'),
    );
    await expect(
      updateUrielData({ filePath, fetchImpl: badJson, now, wait }),
    ).rejects.toThrow('JSON');
    expect(await readFile(filePath, 'utf8')).toBe(history[0]);
    await writeFile(filePath, history.join('\n'));
    await expect(
      updateUrielData({ filePath, fetchImpl: fetchResults(2), now, wait }),
    ).rejects.toThrow('오래됐어요');
    expect(await readFile(filePath, 'utf8')).toBe(history.join('\n'));
  });

  it('retries transient transport failures but rejects future draw data', async () => {
    await writeFile(filePath, history[0]);
    const fetchImpl = fetchResults();
    fetchImpl.mockRejectedValueOnce(new Error('network timeout'));
    await updateUrielData({ filePath, fetchImpl, now, wait });
    expect(wait).toHaveBeenCalledWith(1000);
    await writeFile(filePath, history[0]);
    await expect(
      updateUrielData({
        filePath,
        fetchImpl: fetchResults(),
        now: new Date('2002-12-20T00:00:00Z'),
        wait,
      }),
    ).rejects.toThrow('미래');
    expect(await readFile(filePath, 'utf8')).toBe(history[0]);
  });

  it('does not overwrite a concurrent local edit or remove another process lock', async () => {
    await writeFile(filePath, history[0]);
    const fetchImpl = vi.fn(async (url) => {
      if (url === RESULT_URL) return new Response(page(3));
      await writeFile(filePath, 'a concurrent edit');
      return response(results);
    });
    await expect(updateUrielData({ filePath, fetchImpl, now, wait })).rejects.toThrow(
      '원본 파일이 변경',
    );
    expect(await readFile(filePath, 'utf8')).toBe('a concurrent edit');
    await writeFile(`${filePath}.lock`, 'another process');
    await expect(updateUrielData({ filePath, fetchImpl, now, wait })).rejects.toThrow(
      '실행 중',
    );
    expect(await readFile(`${filePath}.lock`, 'utf8')).toBe('another process');
  });

  it('revalidates the browser cache after a new CSV deployment', async () => {
    const fetchImpl = vi.fn(async () => new Response(history.join('\n')));
    vi.stubGlobal('fetch', fetchImpl);
    expect(await loadBundledDraws()).toHaveLength(3);
    expect(fetchImpl).toHaveBeenCalledWith('/projects/uriel/data/draws.csv', {
      cache: 'no-cache',
    });
  });
});
