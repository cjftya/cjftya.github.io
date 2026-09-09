import { getObservationPreset } from '../../model/observationPresets';
import type { ObservationPresetId } from '../../observation/types';
import { buildVaccinia } from './complex';
import { buildHSV, buildInfluenza, buildVSV } from './enveloped';
import { buildM13, buildTMV } from './helical';
import { buildAdenovirus, buildMS2, buildRotavirus } from './icosahedral';
import { buildCoronavirus, buildFilovirus, buildLentivirus } from './emerging';
import {
  buildGenericEnveloped,
  buildGenericFilament,
  buildGenericGeminate,
  buildGenericIcosahedral,
  buildGenericLayered,
  buildGenericPhage,
  buildGenericRod,
  buildGenericSpindle,
} from './generic';
import { buildLambdaPhage, buildT4Phage, buildT7Phage } from './phages';
import { buildAlphavirus, buildCystovirus, buildHBV } from './specialEnveloped';
import { createCollector, finishCollector } from './shared';
import type { ObservationModel } from './types';

export function createObservationModel(
  presetId: ObservationPresetId,
  quality: 'high' | 'low',
): ObservationModel {
  const definition = getObservationPreset(presetId);
  const collector = createCollector(definition);
  switch (definition.modelBuilder) {
    case 't4':
      buildT4Phage(collector, quality);
      break;
    case 'lambda':
      buildLambdaPhage(collector, quality);
      break;
    case 't7':
      buildT7Phage(collector, quality);
      break;
    case 'ms2':
      buildMS2(collector, quality);
      break;
    case 'tmv':
      buildTMV(collector, quality);
      break;
    case 'm13':
      buildM13(collector, quality);
      break;
    case 'adenovirus':
      buildAdenovirus(collector, quality);
      break;
    case 'rotavirus':
      buildRotavirus(collector, quality);
      break;
    case 'hsv':
      buildHSV(collector, quality);
      break;
    case 'influenza':
      buildInfluenza(collector, quality);
      break;
    case 'vsv':
      buildVSV(collector, quality);
      break;
    case 'vaccinia':
      buildVaccinia(collector, quality);
      break;
    case 'filovirus':
      buildFilovirus(collector, quality);
      break;
    case 'lentivirus':
      buildLentivirus(collector, quality);
      break;
    case 'coronavirus':
      buildCoronavirus(collector, quality);
      break;
    case 'hbv':
      buildHBV(collector, quality);
      break;
    case 'alphavirus':
      buildAlphavirus(collector, quality);
      break;
    case 'cystovirus':
      buildCystovirus(collector, quality);
      break;
    case 'generic-icosahedral':
      buildGenericIcosahedral(collector, quality);
      break;
    case 'generic-phage':
      buildGenericPhage(collector, quality);
      break;
    case 'generic-filament':
      buildGenericFilament(collector, quality);
      break;
    case 'generic-enveloped':
      buildGenericEnveloped(collector, quality);
      break;
    case 'generic-layered':
      buildGenericLayered(collector, quality);
      break;
    case 'generic-geminate':
      buildGenericGeminate(collector, quality);
      break;
    case 'generic-spindle':
      buildGenericSpindle(collector, quality);
      break;
    case 'generic-rod':
      buildGenericRod(collector, quality);
      break;
  }
  return finishCollector(collector);
}
