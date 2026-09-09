import type {
  DecorationLevel,
  InspectionView,
  ObservationLayerId,
  ObservationPartId,
  ScannerAxis,
} from '../observation/types';
import type { RenderQuality } from '../rendering/quality/quality';
import { requiredElement } from './layout';
import type { FontScale } from './preferences';

export interface VirusSimControlActions {
  readonly activateVirus: (id: string) => void;
  readonly saveImage: () => Promise<boolean>;
  readonly setView: (view: InspectionView) => void;
  readonly setExplosion: (value: number) => void;
  readonly setSectionOffset: (value: number) => void;
  readonly setGenomeVisible: (visible: boolean) => void;
  readonly setLayerVisible: (layer: ObservationLayerId, visible: boolean) => void;
  readonly selectPart: (part: ObservationPartId) => void;
  readonly setScannerEnabled: (enabled: boolean) => void;
  readonly setScannerAxis: (axis: ScannerAxis) => void;
  readonly setScannerPosition: (position: number) => void;
  readonly setScannerThickness: (thickness: number) => void;
  readonly setDecorationLevel: (level: DecorationLevel) => void;
  readonly setDecorationPaused: (paused: boolean) => void;
  readonly setQuality: (quality: RenderQuality) => void;
  readonly setFontScale: (scale: FontScale) => void;
}

export function bindVirusSimControls(
  root: HTMLElement,
  actions: VirusSimControlActions,
): () => void {
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const element = <T extends Element>(selector: string): T =>
    requiredElement<T>(root, selector);

  element<HTMLSelectElement>('#virus-select').addEventListener(
    'change',
    (event) => actions.activateVirus(inputValue(event)),
    options,
  );

  const saveButton = element<HTMLButtonElement>('#save-image');
  saveButton.addEventListener(
    'click',
    async () => {
      const original = saveButton.textContent;
      saveButton.disabled = true;
      saveButton.textContent = '저장 중…';
      const ok = await actions.saveImage();
      saveButton.textContent = ok ? '저장 완료' : '저장 실패';
      window.setTimeout(() => {
        if (abort.signal.aborted) return;
        saveButton.textContent = original;
        saveButton.disabled = false;
      }, 1400);
    },
    options,
  );

  root
    .querySelectorAll<HTMLButtonElement>('[data-observation-view]')
    .forEach((button) => {
      button.addEventListener(
        'click',
        () => actions.setView(button.dataset.observationView as InspectionView),
        options,
      );
    });
  element<HTMLInputElement>('#observation-explosion').addEventListener(
    'input',
    (event) => actions.setExplosion(Number(inputValue(event))),
    options,
  );
  element<HTMLInputElement>('#observation-section-offset').addEventListener(
    'input',
    (event) => actions.setSectionOffset(Number(inputValue(event)) / 100),
    options,
  );
  element<HTMLInputElement>('#observation-genome').addEventListener(
    'change',
    (event) => actions.setGenomeVisible(inputChecked(event)),
    options,
  );
  root
    .querySelectorAll<HTMLInputElement>('[data-observation-layer]')
    .forEach((input) => {
      input.addEventListener(
        'change',
        () =>
          actions.setLayerVisible(
            input.dataset.observationLayer as ObservationLayerId,
            input.checked,
          ),
        options,
      );
    });
  root
    .querySelectorAll<HTMLButtonElement>('[data-observation-part]')
    .forEach((button) => {
      button.addEventListener(
        'click',
        () => actions.selectPart(button.dataset.observationPart as ObservationPartId),
        options,
      );
    });

  element<HTMLInputElement>('#scanner-enabled').addEventListener(
    'change',
    (event) => actions.setScannerEnabled(inputChecked(event)),
    options,
  );
  element<HTMLSelectElement>('#scanner-axis').addEventListener(
    'change',
    (event) => actions.setScannerAxis(inputValue(event) as ScannerAxis),
    options,
  );
  element<HTMLInputElement>('#scanner-position').addEventListener(
    'input',
    (event) => actions.setScannerPosition(Number(inputValue(event)) / 100),
    options,
  );
  element<HTMLInputElement>('#scanner-thickness').addEventListener(
    'input',
    (event) => actions.setScannerThickness(Number(inputValue(event)) / 100),
    options,
  );
  element<HTMLSelectElement>('#decoration-level').addEventListener(
    'change',
    (event) => actions.setDecorationLevel(inputValue(event) as DecorationLevel),
    options,
  );
  element<HTMLInputElement>('#decoration-paused').addEventListener(
    'change',
    (event) => actions.setDecorationPaused(inputChecked(event)),
    options,
  );
  element<HTMLSelectElement>('#quality-select').addEventListener(
    'change',
    (event) => actions.setQuality(inputValue(event) as RenderQuality),
    options,
  );
  element<HTMLSelectElement>('#font-scale').addEventListener(
    'change',
    (event) => actions.setFontScale(inputValue(event) as FontScale),
    options,
  );

  const guide = element<HTMLDialogElement>('#model-guide');
  element<HTMLButtonElement>('#open-guide').addEventListener(
    'click',
    () => guide.showModal(),
    options,
  );
  root.addEventListener(
    'virus-context-status',
    (event) => {
      const lost = (event as CustomEvent<string>).detail === 'lost';
      element<HTMLElement>('#context-message').hidden = !lost;
    },
    options,
  );

  return () => abort.abort();
}

function inputValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLSelectElement).value;
}

function inputChecked(event: Event): boolean {
  return (event.target as HTMLInputElement).checked;
}
