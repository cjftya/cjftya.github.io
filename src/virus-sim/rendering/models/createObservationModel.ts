import { getObservationPreset } from '../../model/observationPresets';
import type { ObservationPresetId } from '../../observation/types';
import type { ModelBuilderId } from '../../catalog/types';
import { buildVaccinia } from './complex';
import { buildHSV, buildInfluenza, buildVSV } from './enveloped';
import { buildM13, buildTMV } from './helical';
import { buildAdenovirus, buildMS2, buildRotavirus } from './icosahedral';
import { buildSignatureIcosahedral } from './icosahedralFamilies';
import { buildLayeredCapsid } from './layeredCapsids';
import { buildCoronavirus, buildFilovirus, buildLentivirus } from './emerging';
import {
  buildLambdaPhage,
  buildSignaturePhage,
  buildT4Phage,
  buildT7Phage,
} from './phages';
import { buildAlphavirus, buildCystovirus, buildHBV } from './specialEnveloped';
import {
  buildArchaealRod,
  buildGeminateCapsid,
  buildPlantFilament,
  buildSpindleVirus,
} from './specialGeometry';
import { createCollector, finishCollector, type ModelCollector } from './shared';
import type { ObservationModel } from './types';

type ModelBuilder = (collector: ModelCollector, quality: 'high' | 'low') => void;

const MODEL_BUILDERS = {
  t4: buildT4Phage,
  lambda: buildLambdaPhage,
  t7: buildT7Phage,
  'phage-family': buildSignaturePhage,
  ms2: buildMS2,
  tmv: buildTMV,
  m13: buildM13,
  adenovirus: buildAdenovirus,
  rotavirus: buildRotavirus,
  hsv: buildHSV,
  influenza: buildInfluenza,
  vsv: buildVSV,
  vaccinia: buildVaccinia,
  filovirus: buildFilovirus,
  lentivirus: buildLentivirus,
  coronavirus: buildCoronavirus,
  hbv: buildHBV,
  alphavirus: buildAlphavirus,
  cystovirus: buildCystovirus,
  'icosahedral-capsid': buildSignatureIcosahedral,
  'layered-capsid': buildLayeredCapsid,
  'plant-filament': buildPlantFilament,
  'archaeal-rod': buildArchaealRod,
  'spindle-virus': buildSpindleVirus,
  'geminate-capsid': buildGeminateCapsid,
} satisfies Record<ModelBuilderId, ModelBuilder>;

export function createObservationModel(
  presetId: ObservationPresetId,
  quality: 'high' | 'low',
): ObservationModel {
  const definition = getObservationPreset(presetId);
  const collector = createCollector(definition);
  MODEL_BUILDERS[definition.modelBuilder](collector, quality);
  return finishCollector(collector);
}
