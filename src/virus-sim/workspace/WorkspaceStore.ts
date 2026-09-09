export type WorkspaceMode = 'observation' | 'lab';
export type ObservationTab = 'catalog' | 'structure' | 'settings';
export type LabTab = 'specimens' | 'environment' | 'results' | 'settings';

export interface WorkspaceSnapshot {
  readonly mode: WorkspaceMode;
  readonly observationTab: ObservationTab;
  readonly labTab: LabTab;
  readonly inspectingLabSpecimen: boolean;
}

export class WorkspaceStore {
  private state: WorkspaceSnapshot = {
    mode: 'observation',
    observationTab: 'catalog',
    labTab: 'specimens',
    inspectingLabSpecimen: false,
  };

  getSnapshot(): WorkspaceSnapshot {
    return { ...this.state };
  }

  setMode(mode: WorkspaceMode): void {
    this.state = { ...this.state, mode, inspectingLabSpecimen: false };
  }

  setTab(tab: string): void {
    if (this.state.mode === 'observation' && isObservationTab(tab))
      this.state = { ...this.state, observationTab: tab };
    if (this.state.mode === 'lab' && isLabTab(tab))
      this.state = { ...this.state, labTab: tab };
  }

  enterLabInspection(): void {
    this.state = { ...this.state, mode: 'observation', inspectingLabSpecimen: true };
  }

  leaveLabInspection(): void {
    this.state = { ...this.state, mode: 'lab', inspectingLabSpecimen: false };
  }
}

function isObservationTab(tab: string): tab is ObservationTab {
  return ['catalog', 'structure', 'settings'].includes(tab);
}

function isLabTab(tab: string): tab is LabTab {
  return ['specimens', 'environment', 'results', 'settings'].includes(tab);
}
