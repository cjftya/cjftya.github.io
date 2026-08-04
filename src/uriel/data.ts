import type { LottoDraw } from './types';

const EXPECTED_COLUMN_COUNT = 8;

export async function loadBundledDraws(): Promise<LottoDraw[]> {
  const response = await fetch('/projects/uriel/data/draws.csv');

  if (!response.ok) {
    throw new Error('기본 회차 데이터를 불러오지 못했어요.');
  }

  return parseDrawCsv(await response.text());
}

export function parseDrawCsv(source: string): LottoDraw[] {
  const draws = source
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseLine)
    .filter((draw): draw is LottoDraw => draw !== null)
    .sort((left, right) => left.round - right.round);

  if (draws.length === 0) {
    throw new Error('회차, 날짜, 당첨번호 6개가 있는 CSV인지 확인해 주세요.');
  }

  const rounds = new Set<number>();
  draws.forEach((draw) => {
    if (rounds.has(draw.round)) {
      throw new Error(`${draw.round}회 데이터가 두 번 들어 있어요.`);
    }
    rounds.add(draw.round);
  });

  return draws;
}

function parseLine(line: string): LottoDraw | null {
  const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
  const cells = line
    .split(delimiter)
    .map((cell) => cell.trim().replace(/^["']|["']$/g, ''));

  if (cells.length < EXPECTED_COLUMN_COUNT) {
    return null;
  }

  const round = Number(cells[0]);
  const numbers = cells.slice(2, 8).map(Number);

  if (
    !Number.isInteger(round) ||
    round < 1 ||
    numbers.length !== 6 ||
    numbers.some((number) => !Number.isInteger(number) || number < 1 || number > 45) ||
    new Set(numbers).size !== 6
  ) {
    return null;
  }

  return {
    round,
    date: cells[1] ?? '',
    numbers: [...numbers].sort((left, right) => left - right),
  };
}
