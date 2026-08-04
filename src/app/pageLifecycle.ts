interface PageLifecycleApp {
  dispose: () => void;
  pause: () => void;
  resume: () => void;
}

export function handlePageHide(
  app: PageLifecycleApp,
  event: Pick<PageTransitionEvent, 'persisted'>,
): void {
  if (event.persisted) {
    app.pause();
    return;
  }

  app.dispose();
}

export function handlePageShow(app: PageLifecycleApp): void {
  app.resume();
}
