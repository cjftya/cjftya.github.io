import { describe, expect, it, vi } from 'vitest';
import { handlePageHide, handlePageShow } from '../src/app/pageLifecycle';

function createLifecycleApp() {
  return {
    dispose: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  };
}

describe('page lifecycle', () => {
  it('keeps the app alive when the page enters the back-forward cache', () => {
    const app = createLifecycleApp();

    handlePageHide(app, { persisted: true });

    expect(app.pause).toHaveBeenCalledOnce();
    expect(app.dispose).not.toHaveBeenCalled();
  });

  it('disposes the app when the document is actually being discarded', () => {
    const app = createLifecycleApp();

    handlePageHide(app, { persisted: false });

    expect(app.dispose).toHaveBeenCalledOnce();
    expect(app.pause).not.toHaveBeenCalled();
  });

  it('resumes rendering when a cached page is shown again', () => {
    const app = createLifecycleApp();

    handlePageShow(app);

    expect(app.resume).toHaveBeenCalledOnce();
  });
});
