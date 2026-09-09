import { getCatalogEntry } from '../catalog/registry';
import { effectiveFlowSpeed } from '../lab/physics/velocityField';
import { getPhysicsProfile, scaleForVirus } from '../lab/profiles/registry';
import type { LabSnapshot } from '../lab/types';
import { requiredElement } from './layout';

const STATUS_LABELS: Readonly<Record<LabSnapshot['status'], string>> = {
  ready: '준비',
  running: '실행 중',
  paused: '정지',
  completed: '완료',
  inspecting: '구조 관찰',
};

export class LabPanel {
  constructor(private readonly root: HTMLElement) {}

  sync(snapshot: LabSnapshot): void {
    const environment = snapshot.config.environment;
    this.text('#lab-clock', `${snapshot.simTime.toFixed(2)} sim-s`);
    this.text('#lab-run-status', STATUS_LABELS[snapshot.status]);
    this.text('#lab-stage-state', STATUS_LABELS[snapshot.status].toUpperCase());
    this.text('#stage-label', `PHYSICS ARENA · ${snapshot.bodies.length} SPECIMENS`);
    this.text('#lab-specimen-count', String(snapshot.bodies.length));
    this.text(
      '#lab-flow-speed',
      `유속 ${effectiveFlowSpeed(environment).toFixed(2)} lab-unit/s`,
    );
    this.select('#lab-time-scale').value = String(snapshot.timeScale);
    this.select('#lab-chamber').value = environment.chamber;
    this.select('#lab-flow-preset').value = environment.flowPreset;
    this.select('#lab-flow-direction').value = String(environment.flowDirection);
    this.range('#lab-drive', environment.drive * 100);
    this.text('#lab-drive-value', environment.drive.toFixed(2));
    this.range('#lab-viscosity', environment.viscosityRatio * 100);
    this.text('#lab-viscosity-value', `${environment.viscosityRatio.toFixed(2)}×`);
    this.range('#lab-shear', environment.shearStrength * 100);
    this.text('#lab-shear-value', environment.shearStrength.toFixed(2));
    this.range('#lab-vortex', environment.vortexStrength * 100);
    this.text('#lab-vortex-value', environment.vortexStrength.toFixed(2));
    this.range('#lab-gap', environment.gapWidth * 100);
    this.text('#lab-gap-value', environment.gapWidth.toFixed(2));
    this.checkbox('#lab-brownian').checked = environment.brownianEnabled;
    this.checkbox('#lab-all-trajectories').checked = snapshot.showAllTrajectories;
    this.element('#lab-shear-row').hidden = environment.flowPreset !== 'shear';
    this.element('#lab-vortex-row').hidden = environment.flowPreset !== 'vortex';
    this.element('#lab-gap-row').hidden = environment.chamber !== 'obstacle';
    this.select('#lab-scale-mode').value = snapshot.config.scaleMode;
    this.text(
      '#lab-scale-note',
      snapshot.config.scaleMode === 'physical'
        ? '도감의 대표 나노미터 치수를 같은 lab-unit 비율로 환산해요.'
        : '대표 길이 맞춤은 실제 크기·부피·질량 비율이 아니에요.',
    );
    this.select('#lab-duration').value = String(snapshot.config.durationSeconds);
    this.syncButtons(snapshot);
    this.syncSpecimens(snapshot);
    this.syncResults(snapshot);
    const message = this.element('#lab-message');
    message.hidden = !snapshot.message;
    message.textContent = snapshot.message ?? '';
  }

  private syncButtons(snapshot: LabSnapshot): void {
    const locked = snapshot.status === 'running' || snapshot.status === 'inspecting';
    this.button('#lab-play').disabled =
      snapshot.status === 'running' || snapshot.status === 'inspecting';
    this.button('#lab-pause').disabled = snapshot.status !== 'running';
    this.button('#lab-replay').disabled =
      snapshot.status === 'running' ||
      snapshot.status === 'inspecting' ||
      snapshot.replaying;
    this.button('#lab-load-config').disabled = locked;
    this.button('#lab-add-specimen').disabled = locked || snapshot.bodies.length >= 8;
    this.button('#lab-replace-specimen').disabled =
      locked || !snapshot.selectedInstanceId;
    this.button('#lab-remove-specimen').disabled =
      locked || snapshot.bodies.length <= 1;
    this.button('#lab-inspect-structure').disabled = !snapshot.selectedInstanceId;
    this.button('#lab-swap-positions').disabled = locked || snapshot.bodies.length < 2;
    this.select('#lab-chamber').disabled = locked;
    this.select('#lab-flow-preset').disabled = locked;
    this.select('#lab-scale-mode').disabled = locked;
    this.select('#lab-duration').disabled = locked;
    this.button('#lab-replay').textContent = snapshot.replaying
      ? '이전 실행 재생 중'
      : '같은 조건으로 재실험';
  }

  private syncSpecimens(snapshot: LabSnapshot): void {
    const list = this.element('#lab-specimen-list');
    list.innerHTML = snapshot.bodies
      .map((body, index) => {
        const entry = getCatalogEntry(body.virusId);
        const profile = getPhysicsProfile(body.virusId);
        const scale = scaleForVirus(body.virusId, snapshot.config.scaleMode);
        const selected = body.instanceId === snapshot.selectedInstanceId;
        return `<button class="lab-specimen-card${selected ? ' is-active' : ''}" data-lab-instance="${body.instanceId}" role="radio" aria-checked="${selected}" type="button"><strong>${index + 1}. ${entry.shortName}</strong><small>${shapeLabel(profile.shape)} · ${scale.physical ? '실제 치수 기준' : '대표 길이 맞춤'}</small></button>`;
      })
      .join('');
    const selected = snapshot.bodies.find(
      (body) => body.instanceId === snapshot.selectedInstanceId,
    );
    if (!selected) {
      this.text('#lab-selection-title', '표본을 선택해보세요');
      this.text(
        '#lab-selection-description',
        '3D 화면이나 목록에서 표본을 선택할 수 있어요.',
      );
      return;
    }
    const entry = getCatalogEntry(selected.virusId);
    const profile = getPhysicsProfile(selected.virusId);
    this.text('#lab-selection-title', entry.name);
    this.text(
      '#lab-selection-description',
      `${profile.approximationNote} ${entry.feature}`,
    );
  }

  private syncResults(snapshot: LabSnapshot): void {
    const passed = snapshot.results.filter(
      (result) => result.state === 'passed',
    ).length;
    this.text(
      '#lab-result-summary',
      `${snapshot.simTime.toFixed(2)} sim-s · 통과 ${passed}/${snapshot.results.length} · 조건 변경 ${snapshot.commandCount}건`,
    );
    const list = this.element('#lab-result-list');
    list.innerHTML = snapshot.results
      .map((result) => {
        const body = snapshot.bodies.find(
          (item) => item.instanceId === result.instanceId,
        );
        const name = body ? getCatalogEntry(body.virusId).shortName : result.instanceId;
        const state =
          result.state === 'passed'
            ? `통과 · ${result.passedAt?.toFixed(2)} sim-s`
            : result.state === 'not-passed'
              ? '제한 시간 내 미통과'
              : result.state === 'moving'
                ? '진행 중'
                : '대기';
        return `<article class="lab-result-card"><strong>${name}</strong><small>${state}</small><small>시작 (${result.startPosition.map((value) => value.toFixed(1)).join(', ')})</small></article>`;
      })
      .join('');
  }

  private text(selector: string, value: string): void {
    this.element(selector).textContent = value;
  }

  private button(selector: string): HTMLButtonElement {
    return requiredElement<HTMLButtonElement>(this.root, selector);
  }

  private select(selector: string): HTMLSelectElement {
    return requiredElement<HTMLSelectElement>(this.root, selector);
  }

  private checkbox(selector: string): HTMLInputElement {
    return requiredElement<HTMLInputElement>(this.root, selector);
  }

  private range(selector: string, value: number): void {
    this.checkbox(selector).value = String(Math.round(value));
  }

  private element(selector: string): HTMLElement {
    return requiredElement<HTMLElement>(this.root, selector);
  }
}

function shapeLabel(shape: string): string {
  return (
    (
      {
        sphere: '구형',
        capsule: '강직 capsule',
        filament: '제한 굽힘 filament',
        compound: '복합 충돌체',
      } as Record<string, string>
    )[shape] ?? shape
  );
}
