import type {
  ChamberKind,
  FlowPreset,
  LabCommandProperty,
  LabScaleMode,
} from '../lab/types';
import type { WorkspaceMode } from '../workspace/WorkspaceStore';
import { requiredElement } from './layout';

export interface LabControlActions {
  readonly setMode: (mode: WorkspaceMode) => void;
  readonly setTab: (tab: string) => void;
  readonly play: () => void;
  readonly pause: () => void;
  readonly restart: () => void;
  readonly replay: () => void;
  readonly setTimeScale: (value: number) => void;
  readonly setEnvironment: (
    property: LabCommandProperty,
    value: number | boolean,
  ) => void;
  readonly setFlowPreset: (value: FlowPreset) => void;
  readonly setChamber: (value: ChamberKind) => void;
  readonly setScaleMode: (value: LabScaleMode) => void;
  readonly setDuration: (value: number) => void;
  readonly selectInstance: (instanceId: string | null) => void;
  readonly addSpecimen: (virusId: string) => void;
  readonly replaceSpecimen: (virusId: string) => void;
  readonly removeSpecimen: () => void;
  readonly swapPositions: () => void;
  readonly setAllTrajectories: (value: boolean) => void;
  readonly inspectStructure: () => void;
  readonly returnToLab: () => void;
  readonly saveConfig: () => void;
  readonly loadConfig: () => void;
  readonly saveImage: () => void;
  readonly contextLost: () => void;
}

export function bindLabControls(
  root: HTMLElement,
  actions: LabControlActions,
): () => void {
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const element = <T extends Element>(selector: string) =>
    requiredElement<T>(root, selector);

  root
    .querySelectorAll<HTMLButtonElement>('[data-workspace-mode-button]')
    .forEach((button) =>
      button.addEventListener(
        'click',
        () => actions.setMode(button.dataset.workspaceModeButton as WorkspaceMode),
        options,
      ),
    );
  root
    .querySelectorAll<HTMLButtonElement>('[data-workspace-tab]')
    .forEach((button) =>
      button.addEventListener(
        'click',
        () => actions.setTab(button.dataset.workspaceTab ?? ''),
        options,
      ),
    );
  element<HTMLButtonElement>('#lab-play').addEventListener(
    'click',
    actions.play,
    options,
  );
  element<HTMLButtonElement>('#lab-pause').addEventListener(
    'click',
    actions.pause,
    options,
  );
  element<HTMLButtonElement>('#lab-restart').addEventListener(
    'click',
    actions.restart,
    options,
  );
  element<HTMLButtonElement>('#lab-replay').addEventListener(
    'click',
    actions.replay,
    options,
  );
  element<HTMLSelectElement>('#lab-time-scale').addEventListener(
    'change',
    (event) => actions.setTimeScale(Number(inputValue(event))),
    options,
  );
  element<HTMLSelectElement>('#lab-chamber').addEventListener(
    'change',
    (event) => actions.setChamber(inputValue(event) as ChamberKind),
    options,
  );
  element<HTMLSelectElement>('#lab-flow-preset').addEventListener(
    'change',
    (event) => actions.setFlowPreset(inputValue(event) as FlowPreset),
    options,
  );
  element<HTMLSelectElement>('#lab-flow-direction').addEventListener(
    'change',
    (event) => actions.setEnvironment('flowDirection', Number(inputValue(event))),
    options,
  );
  bindRange(element, '#lab-drive', 'drive', 100, actions, options);
  bindRange(element, '#lab-viscosity', 'viscosityRatio', 100, actions, options);
  bindRange(element, '#lab-shear', 'shearStrength', 100, actions, options);
  bindRange(element, '#lab-vortex', 'vortexStrength', 100, actions, options);
  bindRange(element, '#lab-gap', 'gapWidth', 100, actions, options);
  element<HTMLInputElement>('#lab-brownian').addEventListener(
    'change',
    (event) => actions.setEnvironment('brownianEnabled', inputChecked(event)),
    options,
  );
  element<HTMLSelectElement>('#lab-scale-mode').addEventListener(
    'change',
    (event) => actions.setScaleMode(inputValue(event) as LabScaleMode),
    options,
  );
  element<HTMLSelectElement>('#lab-duration').addEventListener(
    'change',
    (event) => actions.setDuration(Number(inputValue(event))),
    options,
  );
  element<HTMLElement>('#lab-specimen-list').addEventListener(
    'click',
    (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>(
        '[data-lab-instance]',
      );
      if (button) actions.selectInstance(button.dataset.labInstance ?? null);
    },
    options,
  );
  element<HTMLButtonElement>('#lab-add-specimen').addEventListener(
    'click',
    () => actions.addSpecimen(element<HTMLSelectElement>('#lab-virus-select').value),
    options,
  );
  element<HTMLButtonElement>('#lab-replace-specimen').addEventListener(
    'click',
    () =>
      actions.replaceSpecimen(element<HTMLSelectElement>('#lab-virus-select').value),
    options,
  );
  element<HTMLButtonElement>('#lab-remove-specimen').addEventListener(
    'click',
    actions.removeSpecimen,
    options,
  );
  element<HTMLButtonElement>('#lab-swap-positions').addEventListener(
    'click',
    actions.swapPositions,
    options,
  );
  element<HTMLInputElement>('#lab-all-trajectories').addEventListener(
    'change',
    (event) => actions.setAllTrajectories(inputChecked(event)),
    options,
  );
  element<HTMLButtonElement>('#lab-inspect-structure').addEventListener(
    'click',
    actions.inspectStructure,
    options,
  );
  element<HTMLButtonElement>('#return-to-lab').addEventListener(
    'click',
    actions.returnToLab,
    options,
  );
  element<HTMLButtonElement>('#lab-save-config').addEventListener(
    'click',
    actions.saveConfig,
    options,
  );
  element<HTMLButtonElement>('#lab-load-config').addEventListener(
    'click',
    actions.loadConfig,
    options,
  );
  element<HTMLButtonElement>('#lab-save-image').addEventListener(
    'click',
    actions.saveImage,
    options,
  );
  root.addEventListener(
    'virus-context-status',
    (event) => {
      if ((event as CustomEvent<string>).detail === 'lost') actions.contextLost();
    },
    options,
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) actions.contextLost();
    },
    options,
  );
  return () => abort.abort();
}

function bindRange(
  element: <T extends Element>(selector: string) => T,
  selector: string,
  property: LabCommandProperty,
  divisor: number,
  actions: LabControlActions,
  options: AddEventListenerOptions,
): void {
  element<HTMLInputElement>(selector).addEventListener(
    'input',
    (event) => actions.setEnvironment(property, Number(inputValue(event)) / divisor),
    options,
  );
}

function inputValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLSelectElement).value;
}

function inputChecked(event: Event): boolean {
  return (event.target as HTMLInputElement).checked;
}
