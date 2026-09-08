import { describe, expect, it } from 'vitest';
import { VIRUS_EXPERIENCE_PROFILES } from '../../src/virus-sim/catalog/experienceProfiles';
import { VIRUS_CATALOG } from '../../src/virus-sim/catalog/registry';
import { ExperienceDirector } from '../../src/virus-sim/experience/ExperienceDirector';
import { detectObservationMoment } from '../../src/virus-sim/experience/ObservationMomentDetector';
import { ObservationController } from '../../src/virus-sim/observation/ObservationController';
import { createSpecimenPersonality } from '../../src/virus-sim/observation/specimen/SpecimenPersonality';
import { applyScientificMaterials } from '../../src/virus-sim/rendering/materials/scientificMaterials';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';
import {
  TIME_LENS_SPEEDS,
  normalizeTimeLensSpeed,
} from '../../src/virus-sim/time/TimeLens';
import { renderAppLayout } from '../../src/virus-sim/ui/layout';

describe('Virus Sim v3 microworld experience contracts', () => {
  it('gives every verified virus a complete v3 profile and ten heroes deeper paths', () => {
    expect(VIRUS_EXPERIENCE_PROFILES).toHaveLength(VIRUS_CATALOG.length);
    expect(
      new Set(VIRUS_EXPERIENCE_PROFILES.map((profile) => profile.virusId)).size,
    ).toBe(VIRUS_CATALOG.length);
    const heroes = VIRUS_EXPERIENCE_PROFILES.filter((profile) => profile.hero);
    expect(heroes).toHaveLength(10);
    for (const profile of VIRUS_EXPERIENCE_PROFILES) {
      expect(profile.surfaceStops.length).toBeGreaterThanOrEqual(2);
      expect(profile.documentaryAngles.length).toBeGreaterThanOrEqual(3);
      expect(profile.explodedSequence.length).toBeGreaterThan(0);
      expect(profile.supportedExperience.surfaceDive).toBe(true);
      expect(profile.supportedExperience.explodedView).toBe(true);
      expect(profile.supportedExperience.cutaway).toBe(true);
      expect(Boolean(profile.interiorPath)).toBe(profile.hero);
      if (profile.hero) expect(profile.interiorPath?.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('creates deterministic specimen individuality without changing structure data', () => {
    const first = createSpecimenPersonality(730_421, 't4', 2);
    const repeated = createSpecimenPersonality(730_421, 't4', 2);
    const sibling = createSpecimenPersonality(730_421, 't4', 3);
    expect(first).toEqual(repeated);
    expect(first).not.toEqual(sibling);
    expect(first.pathScale).toBeGreaterThanOrEqual(0.82);
    expect(first.pathScale).toBeLessThanOrEqual(1.18);
    expect(VIRUS_CATALOG.find((virus) => virus.id === 't4')?.parts).toContain('capsid');
  });

  it('moves through Scale Dive with one state source and returns without teleport state', () => {
    const controller = new ObservationController(false, 41);
    controller.setExperienceStage('follow');
    controller.setExperienceStage('approach');
    controller.setExperienceStage('surface');
    controller.enterInterior();
    expect(controller.getSnapshot().experience.stage).toBe('interior');
    expect(controller.getSnapshot().view).toBe('section');
    expect(controller.getSnapshot().genomeVisible).toBe(true);
    controller.setExperienceStage('return');
    expect(controller.getSnapshot().experience.stage).toBe('return');
    controller.completeReturn();
    const returned = controller.getSnapshot();
    expect(returned.experience.stage).toBe('observe');
    expect(returned.view).toBe('surface');
    expect(returned.explosion).toBe(0);
    expect(returned.genomeVisible).toBe(false);
  });

  it('animates structural reveal and reassembly even when specimen time is frozen', () => {
    const controller = new ObservationController(false, 73);
    controller.setRunning(false);
    const frozenPose = controller.getSnapshot().motion;
    controller.startStructuralReveal('exploded');
    controller.stepExperience(2);
    const exploded = controller.getSnapshot();
    expect(exploded.running).toBe(false);
    expect(exploded.view).toBe('exploded');
    expect(exploded.explosion).toBe(74);
    controller.reassemble();
    controller.stepExperience(2);
    const rebuilt = controller.getSnapshot();
    expect(rebuilt.experience.stage).toBe('surface');
    expect(rebuilt.view).toBe('surface');
    expect(rebuilt.explosion).toBe(0);
    expect(rebuilt.motion.position).toEqual(frozenPose.position);
    expect(rebuilt.motion.quaternion).toEqual(frozenPose.quaternion);
  });

  it('supports the complete Time Lens scale and keeps trace controls independent', () => {
    expect(TIME_LENS_SPEEDS).toEqual([0.1, 0.25, 0.5, 1, 2, 4, 8]);
    expect(normalizeTimeLensSpeed(0.08)).toBe(0.1);
    expect(normalizeTimeLensSpeed(7.7)).toBe(8);
    const controller = new ObservationController();
    controller.setSpeed(8);
    controller.setMotionTraceVisible(true);
    controller.setTemporalEchoVisible(true);
    const snapshot = controller.getSnapshot();
    expect(snapshot.speed).toBe(8);
    expect(snapshot.experience.motionTraceVisible).toBe(true);
    expect(snapshot.experience.temporalEchoVisible).toBe(true);
  });

  it('detects observation moments and only starts documentary after idle', () => {
    const controller = new ObservationController(false, 92);
    const snapshot = controller.getSnapshot();
    expect(detectObservationMoment(snapshot)).toEqual(
      detectObservationMoment(snapshot),
    );
    const director = new ExperienceDirector();
    expect(director.shouldStartDocumentary(snapshot, 13_999, 0)).toBe(false);
    expect(director.shouldStartDocumentary(snapshot, 14_001, 0)).toBe(true);
    controller.setAutoDocumentary(false);
    expect(director.shouldStartDocumentary(controller.getSnapshot(), 30_000, 0)).toBe(
      false,
    );
  });

  it('applies the scientific material language to every catalog model', () => {
    for (const virus of VIRUS_CATALOG) {
      const model = createObservationModel(virus.id, 'low');
      applyScientificMaterials(model, virus.id, 'performance');
      const upgraded = new Set<string>();
      model.root.traverse((object) => {
        if (!('material' in object)) return;
        const material = (object as { material: { userData: Record<string, unknown> } })
          .material;
        if (material.userData.v3ScientificMaterial)
          upgraded.add(String(material.userData.virusMaterialRole));
      });
      expect(upgraded.size, virus.id).toBeGreaterThan(0);
    }
  });

  it('keeps one observatory while exposing contextual v3 controls', () => {
    const root = { innerHTML: '' } as HTMLElement;
    renderAppLayout(root);
    expect(root.innerHTML).toContain('MICROWORLD EXPERIENCE · v3');
    expect(root.innerHTML).toContain('SCALE DIVE');
    expect(root.innerHTML).toContain('data-observation-speed="0.1"');
    expect(root.innerHTML).toContain('data-observation-speed="8"');
    expect(root.innerHTML).toContain('id="auto-documentary"');
    expect(root.innerHTML).not.toContain('감염 시뮬레이션');
    expect(root.innerHTML).not.toContain('바이러스 전투');
  });
});
