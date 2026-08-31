import { describe, expect, it, vi } from 'vitest';
import { PredictionClient } from '../src/uriel/workers/PredictionClient';
import type { PredictionWorkerPort } from '../src/uriel/workers/PredictionClient';
import type {
  PredictionWorkerReply,
  PredictionWorkerRequest,
} from '../src/uriel/workers/predictionProtocol';
import type { PredictionSnapshot } from '../src/uriel/analysis/predictionTypes';

class FakeWorker implements PredictionWorkerPort {
  onmessage: PredictionWorkerPort['onmessage'] = null;
  onerror: PredictionWorkerPort['onerror'] = null;
  postMessage = vi.fn<(message: PredictionWorkerRequest) => void>();
  terminate = vi.fn();
  reply(reply: PredictionWorkerReply) {
    this.onmessage?.({ data: reply } as MessageEvent<PredictionWorkerReply>);
  }
}
const request = (index: number) => ({
  index,
  layout: 'circle' as const,
  algorithmId: 'baseline' as const,
});
const complete = (id: number): PredictionWorkerReply => ({
  type: 'complete',
  id,
  snapshot: {} as PredictionSnapshot,
});
const setup = () => {
  const worker = new FakeWorker();
  const receive = vi.fn();
  const client = new PredictionClient(worker, [], receive);
  return { worker, receive, client };
};

describe('prediction worker lifecycle', () => {
  it('initializes the dataset once and coalesces rapid changes into the latest request', () => {
    const { worker, receive, client } = setup();
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'init', draws: [] });
    client.request(request(1));
    client.request(request(2));
    client.request(request(3));
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
    worker.reply(complete(99));
    expect(receive).not.toHaveBeenCalled();
    worker.reply(complete(1));
    expect(receive).not.toHaveBeenCalled();
    expect(worker.postMessage).toHaveBeenLastCalledWith({
      type: 'analyze',
      id: 3,
      request: request(3),
    });
    worker.reply(complete(1));
    worker.reply(complete(3));
    expect(receive).toHaveBeenCalledExactlyOnceWith(request(3), complete(3));
  });

  it('discards pending playback work and resumes at the selected round', () => {
    const { worker, receive, client } = setup();
    client.request(request(1));
    client.request(request(2));
    client.pause();
    worker.reply(complete(1));
    expect(receive).not.toHaveBeenCalled();
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
    client.request(request(10));
    worker.reply(complete(4));
    expect(receive).toHaveBeenCalledExactlyOnceWith(request(10), complete(4));
  });

  it('cannot display a late reply after the dataset is replaced or the view unmounts', () => {
    const { worker, receive, client } = setup();
    client.request(request(1));
    const lateMessage = worker.onmessage;
    client.dispose();
    lateMessage?.({ data: complete(1) } as MessageEvent<PredictionWorkerReply>);
    client.request(request(2));
    expect(receive).not.toHaveBeenCalled();
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(worker.onmessage).toBeNull();
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
    const replacement = setup();
    replacement.client.request(request(2));
    replacement.worker.reply(complete(1));
    expect(replacement.receive).toHaveBeenCalledExactlyOnceWith(
      request(2),
      complete(1),
    );
  });

  it('recovers from an analysis error on the next request', () => {
    const { worker, receive, client } = setup();
    client.request(request(1));
    worker.reply({ type: 'error', id: 1, message: 'invalid round' });
    client.request(request(2));
    worker.reply(complete(2));
    expect(receive).toHaveBeenLastCalledWith(request(2), complete(2));
    expect(worker.terminate).not.toHaveBeenCalled();
  });

  it('reports a crashed worker against the latest request without leaving it loading', () => {
    const { worker, receive, client } = setup();
    client.request(request(1));
    client.request(request(2));
    worker.onerror?.({} as ErrorEvent);
    expect(receive).toHaveBeenCalledWith(
      request(2),
      expect.objectContaining({ type: 'error', id: 2 }),
    );
    expect(worker.terminate).toHaveBeenCalledOnce();
    client.request(request(3));
    expect(receive).toHaveBeenLastCalledWith(
      request(3),
      expect.objectContaining({ type: 'error', id: 3 }),
    );
  });

  it('reports postMessage failures instead of hanging', () => {
    const { worker, receive, client } = setup();
    worker.postMessage.mockImplementation(() => {
      throw new Error('cannot clone');
    });
    client.request(request(1));
    expect(receive).toHaveBeenCalledWith(
      request(1),
      expect.objectContaining({ type: 'error' }),
    );
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
