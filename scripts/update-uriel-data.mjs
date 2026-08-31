import { randomUUID } from 'node:crypto';
import { open, readFile, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

export const RESULT_URL = 'https://www.dhlottery.co.kr/lt645/result';
const API_URL = 'https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do';
const DEFAULT_FILE = fileURLToPath(
  new URL('../public/projects/uriel/data/draws.csv', import.meta.url),
);
const FIRST_DRAW_DATE = Date.UTC(2002, 11, 7);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function integer(value, label) {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    !/^\d+$/.test(String(value)) ||
    !Number.isSafeInteger(Number(value))
  ) {
    throw new Error(`${label}: 정수가 아닌 값이에요.`);
  }
  return Number(value);
}

function validateDraw(draw, today) {
  if (draw.round < 1 || draw.round > 10000) {
    throw new Error('유효하지 않은 회차예요.');
  }
  const expectedDate = new Date(FIRST_DRAW_DATE + (draw.round - 1) * WEEK_MS)
    .toISOString()
    .slice(0, 10);
  if (draw.date !== expectedDate || draw.date > today) {
    throw new Error(`${draw.round}회 추첨 날짜가 잘못됐거나 아직 미래예요.`);
  }
  if (
    draw.numbers.length !== 6 ||
    draw.numbers.some(
      (number) => !Number.isInteger(number) || number < 1 || number > 45,
    ) ||
    new Set(draw.numbers).size !== 6
  ) {
    throw new Error(`${draw.round}회 당첨번호는 서로 다른 1~45의 숫자 6개여야 해요.`);
  }
  return { ...draw, numbers: [...draw.numbers].sort((a, b) => a - b) };
}

// The updater is deliberately stricter than the browser's CSV import: never silently
// drop a malformed row and then overwrite the source history with a shortened file.
function readStoredCsv(source, today) {
  const bom = source.startsWith('\uFEFF') ? '\uFEFF' : '';
  const lines = source.replace(/^\uFEFF/, '').split('\n');
  if (lines.at(-1) === '') lines.pop();
  let header = '';
  if (lines[0]?.trim() === 'round,date,n1,n2,n3,n4,n5,n6') {
    header = `${lines.shift()}\n`;
  }
  const rows = new Map();
  let previousRound = 0;
  for (const raw of lines) {
    const cells = raw
      .trim()
      .split(',')
      .map((cell) => cell.trim().replace(/^"(.*)"$/, '$1'));
    if (cells.length !== 8)
      throw new Error('CSV에 회차·날짜·번호 6개가 아닌 행이 있어요.');
    const draw = validateDraw(
      {
        round: integer(cells[0], '회차'),
        date: cells[1],
        numbers: cells.slice(2).map((value) => integer(value, '당첨번호')),
      },
      today,
    );
    if (rows.has(draw.round)) throw new Error(`${draw.round}회가 CSV에 중복돼 있어요.`);
    if (draw.round <= previousRound) throw new Error('CSV는 회차 오름차순이어야 해요.');
    previousRound = draw.round;
    rows.set(draw.round, { draw, raw });
  }
  if (rows.size === 0)
    throw new Error('기존 CSV가 비어 있어요. 원본부터 확인해 주세요.');
  return { rows, prefix: bom + header, previousLatestRound: previousRound };
}

function latestRoundFromPage(html) {
  const input = html.match(/<input\b[^>]*\bid\s*=\s*["']opt_val["'][^>]*>/i)?.[0];
  const value = input?.match(/\bvalue\s*=\s*["'](\d+)["']/i)?.[1];
  if (!value) throw new Error('공식 결과 페이지에서 최신 회차를 확인하지 못했어요.');
  const round = integer(value, '공식 최신 회차');
  if (round < 1 || round > 10000) throw new Error('공식 최신 회차가 유효하지 않아요.');
  return round;
}

function officialDrawsFromJson(source, today) {
  let payload;
  try {
    payload = JSON.parse(source);
  } catch {
    throw new Error('공식 결과 응답이 JSON이 아니에요. 기존 파일은 유지해요.');
  }
  if (
    (payload?.resultCode != null && payload.resultCode !== '0000') ||
    !Array.isArray(payload?.data?.list) ||
    payload.data.list.length === 0
  ) {
    throw new Error('공식 결과 응답에 확인된 당첨 데이터가 없어요.');
  }
  const seen = new Set();
  return payload.data.list.map((item) => {
    const date = String(item?.ltRflYmd ?? '');
    if (!/^\d{8}$/.test(date)) throw new Error('공식 추첨 날짜 형식이 바뀌었어요.');
    const draw = validateDraw(
      {
        round: integer(item.ltEpsd, '공식 회차'),
        date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`,
        numbers: Array.from({ length: 6 }, (_, i) =>
          integer(item[`tm${i + 1}WnNo`], '공식 당첨번호'),
        ),
      },
      today,
    );
    const bonus = integer(item.bnsWnNo, '공식 보너스 번호');
    if (bonus < 1 || bonus > 45 || draw.numbers.includes(bonus)) {
      throw new Error(`${draw.round}회 보너스 번호가 잘못됐어요.`);
    }
    if (seen.has(draw.round)) throw new Error('공식 응답에 중복 회차가 있어요.');
    seen.add(draw.round);
    return draw;
  });
}

async function requestText(url, { fetchImpl, wait }) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(url, {
        headers: { Accept: 'application/json, text/html', Referer: RESULT_URL },
        signal: AbortSignal.timeout(20000),
        redirect: 'error',
        cache: 'no-store',
      });
      if (response.ok) return await response.text();
    } catch (error) {
      if (attempt === 2)
        throw new Error('공식 결과 조회가 실패했어요. 기존 파일은 유지해요.', {
          cause: error,
        });
    }
    if (
      response &&
      response.status !== 408 &&
      response.status !== 429 &&
      response.status < 500
    ) {
      throw new Error(`공식 결과 조회 HTTP ${response.status}: 기존 파일은 유지해요.`);
    }
    if (attempt === 2)
      throw new Error(
        `공식 결과 조회 HTTP ${response?.status}: 재시도 후에도 실패했어요.`,
      );
    await wait(1000 * 2 ** attempt);
  }
  throw new Error('공식 결과를 가져오지 못했어요.');
}

function sameDraw(left, right) {
  return left.date === right.date && left.numbers.join(',') === right.numbers.join(',');
}

/** Check the official latest round and fill every missing round, committing the file
 * only after the complete batch passes validation. --check never replaces the CSV. */
export async function updateUrielData({
  filePath = DEFAULT_FILE,
  check = false,
  fetchImpl = fetch,
  now = new Date(),
  wait = delay,
} = {}) {
  const lockPath = `${filePath}.lock`;
  const lock = await open(lockPath, 'wx').catch((error) => {
    if (error.code === 'EEXIST') throw new Error('다른 갱신 작업이 실행 중이에요.');
    throw error;
  });
  const tempPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    const source = await readFile(filePath, 'utf8');
    const today = new Date(now.getTime() + 9 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const stored = readStoredCsv(source, today);
    const latestRound = latestRoundFromPage(
      await requestText(RESULT_URL, { fetchImpl, wait }),
    );
    if (latestRound < stored.previousLatestRound) {
      throw new Error('공식 최신 회차가 기존 데이터보다 오래됐어요. 원본을 유지해요.');
    }
    const missing = Array.from({ length: latestRound }, (_, i) => i + 1).filter(
      (round) => !stored.rows.has(round),
    );
    const fetched = new Map();
    let requests = 0;
    // Start with the latest result; one official response often fills several weeks.
    for (const round of [...missing].reverse()) {
      if (fetched.has(round)) continue;
      if (requests > 0) await wait(500);
      const url = new URL(API_URL);
      url.searchParams.set('srchLtEpsd', String(round));
      url.searchParams.set('srchDir', 'center');
      const draws = officialDrawsFromJson(
        await requestText(url.href, { fetchImpl, wait }),
        today,
      );
      requests += 1;
      if (!draws.some((draw) => draw.round === round)) {
        throw new Error(`${round}회 결과가 공식 응답에 없어요. 전체 갱신을 중단해요.`);
      }
      for (const draw of draws) {
        const previous = stored.rows.get(draw.round)?.draw ?? fetched.get(draw.round);
        if (previous && !sameDraw(previous, draw)) {
          throw new Error(
            `${draw.round}회 기존 데이터와 공식 결과가 달라요. 자동으로 덮어쓰지 않아요.`,
          );
        }
        // If a draw was published during this run, pick it up on the next check.
        if (draw.round <= latestRound) fetched.set(draw.round, draw);
      }
    }

    const changed = missing.length > 0;
    if (changed && !check) {
      const newLineSuffix = source.endsWith('\r\n') ? '\r' : '';
      for (const round of missing) {
        const draw = fetched.get(round);
        if (!draw)
          throw new Error(`${round}회가 아직 누락돼 있어 파일을 저장하지 않아요.`);
        stored.rows.set(round, {
          draw,
          raw: `${round},${draw.date},${draw.numbers.join(',')}${newLineSuffix}`,
        });
      }
      const updated =
        stored.prefix +
        [...stored.rows.entries()]
          .sort(([a], [b]) => a - b)
          .map(([, row]) => row.raw)
          .join('\n') +
        '\n';
      readStoredCsv(updated, today);
      const temp = await open(tempPath, 'wx');
      try {
        await temp.writeFile(updated, 'utf8');
        await temp.sync();
      } finally {
        await temp.close();
      }
      if ((await readFile(filePath, 'utf8')) !== source) {
        throw new Error(
          '조회 중 원본 파일이 변경돼 저장을 중단했어요. 다시 실행해 주세요.',
        );
      }
      await rename(tempPath, filePath);
    }
    return {
      source: RESULT_URL,
      previousLatestRound: stored.previousLatestRound,
      latestRound,
      addedRounds: missing,
      changed,
      written: changed && !check,
    };
  } finally {
    await rm(tempPath, { force: true });
    await lock.close();
    await rm(lockPath, { force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--check') || args.length > 1) {
    console.error('사용법: node scripts/update-uriel-data.mjs [--check]');
    process.exitCode = 1;
  } else {
    try {
      console.log(
        JSON.stringify(
          await updateUrielData({ check: args.includes('--check') }),
          null,
          2,
        ),
      );
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
