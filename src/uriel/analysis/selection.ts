export function fourNumberSubsets(numbers: readonly number[]): string[] {
  const keys: string[] = [];
  for (let first = 0; first < numbers.length - 3; first += 1) {
    for (let second = first + 1; second < numbers.length - 2; second += 1) {
      for (let third = second + 1; third < numbers.length - 1; third += 1) {
        for (let fourth = third + 1; fourth < numbers.length; fourth += 1) {
          keys.push(
            [numbers[first], numbers[second], numbers[third], numbers[fourth]].join(
              '-',
            ),
          );
        }
      }
    }
  }
  return keys;
}

/**
 * Returns the same stable Top-K that `values.sort(compare).slice(0, limit)` would
 * produce, without sorting every one of the 40,000 search candidates.  The
 * original index is the explicit tie breaker because Array#sort is stable.
 */
export function selectBestStable<T>(
  values: readonly T[],
  limit: number,
  compare: (left: T, right: T) => number,
): T[] {
  if (limit <= 0) return [];
  if (values.length <= limit) return [...values].sort(compare);

  interface IndexedValue {
    value: T;
    index: number;
  }
  const compareIndexed = (left: IndexedValue, right: IndexedValue) =>
    compare(left.value, right.value) || left.index - right.index;
  const heap: IndexedValue[] = [];
  const isWorse = (left: IndexedValue, right: IndexedValue) =>
    compareIndexed(left, right) > 0;
  const swap = (left: number, right: number) => {
    [heap[left], heap[right]] = [heap[right]!, heap[left]!];
  };
  const siftUp = (start: number) => {
    let index = start;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (!isWorse(heap[index]!, heap[parent]!)) break;
      swap(index, parent);
      index = parent;
    }
  };
  const siftDown = (start: number) => {
    let index = start;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let worst = index;
      if (left < heap.length && isWorse(heap[left]!, heap[worst]!)) worst = left;
      if (right < heap.length && isWorse(heap[right]!, heap[worst]!)) worst = right;
      if (worst === index) break;
      swap(index, worst);
      index = worst;
    }
  };

  values.forEach((value, index) => {
    const entry = { value, index };
    if (heap.length < limit) {
      heap.push(entry);
      siftUp(heap.length - 1);
      return;
    }
    if (compareIndexed(entry, heap[0]!) >= 0) return;
    heap[0] = entry;
    siftDown(0);
  });

  return heap.sort(compareIndexed).map(({ value }) => value);
}
