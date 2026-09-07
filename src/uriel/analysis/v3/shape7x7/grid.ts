export interface GridPoint {
  x: number;
  y: number;
}

export function numberToPoint(number: number): GridPoint {
  if (!Number.isInteger(number) || number < 1 || number > 45) {
    throw new Error('7×7 좌표에는 1~45 번호만 사용할 수 있어요.');
  }
  return { x: (number - 1) % 7, y: Math.floor((number - 1) / 7) };
}

/** The four cells after 45 are outside the lottery domain, not empty numbers. */
export function pointToNumber({ x, y }: GridPoint): number | null {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x > 6 || y < 0 || y > 6)
    return null;
  const number = y * 7 + x + 1;
  return number <= 45 ? number : null;
}

export function combinationPoints(numbers: readonly number[]): GridPoint[] {
  if (numbers.length !== 6 || new Set(numbers).size !== 6) {
    throw new Error('Shape는 서로 다른 번호 6개여야 해요.');
  }
  return numbers.map(numberToPoint);
}
