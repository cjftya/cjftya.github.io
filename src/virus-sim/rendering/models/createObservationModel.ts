import { getObservationPreset } from '../../model/observationPresets';
import type { ObservationPresetId } from '../../observation/types';
import { buildVaccinia } from './complex';
import { buildConceptEnveloped, buildHSV, buildInfluenza, buildVSV } from './enveloped';
import { buildConceptFilamentous, buildM13, buildTMV } from './helical';
import {
  buildAdenovirus,
  buildConceptIcosahedral,
  buildMS2,
  buildRotavirus,
} from './icosahedral';
import { buildLambdaPhage, buildT4Phage, buildT7Phage } from './phages';
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
    case 'concept-filamentous':
      buildConceptFilamentous(collector, quality);
      break;
    case 'concept-enveloped':
      buildConceptEnveloped(collector, quality);
      break;
    case 'concept-icosahedral':
      buildConceptIcosahedral(collector, quality);
      break;
  }
  return finishCollector(collector);
}
