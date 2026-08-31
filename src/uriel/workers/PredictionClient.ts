import type { PredictionRequest } from '../analysis/predictionTypes';
import type { LottoDraw } from '../types';
import type {
  PredictionWorkerReply,
  PredictionWorkerRequest,
} from './predictionProtocol';

export interface PredictionWorkerPort {
  onmessage: ((event: MessageEvent<PredictionWorkerReply>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: PredictionWorkerRequest): void;
  terminate(): void;
}

/** At most one active calculation and one latest request; never queue every slider tick. */
export class PredictionClient {
  private sequence = 0;
  private active: { id: number; request: PredictionRequest } | null = null;
  private pending: { id: number; request: PredictionRequest } | null = null;
  private disposed = false;
  private failure: string | null = null;

  constructor(
    private readonly worker: PredictionWorkerPort,
    draws: readonly LottoDraw[],
    private readonly receive: (
      request: PredictionRequest,
      reply: PredictionWorkerReply,
    ) => void,
  ) {
    worker.onmessage = ({ data }) => {
      if (this.disposed || data.id !== this.active?.id) return;
      const current = this.active;
      this.active = null;
      if (data.id === this.sequence) this.receive(current.request, data);
      this.flush();
    };
    worker.onerror = () =>
      this.fail('분석 Worker에서 오류가 발생했어요. 다시 시도해 주세요.');
    worker.postMessage({ type: 'init', draws });
  }

  request(request: PredictionRequest): void {
    if (this.disposed) return;
    const id = ++this.sequence;
    if (this.failure) {
      this.receive(request, { type: 'error', id, message: this.failure });
      return;
    }
    this.pending = { id, request };
    this.flush();
  }

  pause(): void {
    this.sequence += 1;
    this.pending = null;
  }

  dispose(): void {
    this.disposed = true;
    this.pending = null;
    this.worker.onmessage = null;
    this.worker.onerror = null;
    this.worker.terminate();
  }

  private flush(): void {
    if (this.active || !this.pending || this.disposed) return;
    this.active = this.pending;
    this.pending = null;
    try {
      this.worker.postMessage({ type: 'analyze', ...this.active });
    } catch {
      this.fail('분석 요청을 전달하지 못했어요. 다시 시도해 주세요.');
    }
  }

  private fail(message: string): void {
    if (this.disposed) return;
    this.failure = message;
    const latest = this.pending ?? this.active;
    this.active = null;
    this.pending = null;
    if (latest && latest.id === this.sequence) {
      this.receive(latest.request, { type: 'error', id: latest.id, message });
    }
    this.worker.terminate();
  }
}
