import type { PhageStructuralSignature } from '../../catalog/structuralTypes';
import {
  addContractileTail,
  addDistalArchitecture,
  addNoncontractileTail,
  addPhageConnector,
  addPhageHead,
  addShortTail,
  calculatePhageAxis,
} from './phageComponents';
import type { Quality } from './filamentComponents';
import type { ModelCollector } from './shared';

export function buildT4Phage(collector: ModelCollector, quality: Quality): void {
  buildSignaturePhage(collector, quality);
}

export function buildLambdaPhage(collector: ModelCollector, quality: Quality): void {
  buildSignaturePhage(collector, quality);
}

export function buildT7Phage(collector: ModelCollector, quality: Quality): void {
  buildSignaturePhage(collector, quality);
}

export function buildSignaturePhage(collector: ModelCollector, quality: Quality): void {
  const signature = requirePhageSignature(collector);
  const axis = calculatePhageAxis(signature);

  addPhageHead(collector, quality, signature, axis);
  addPhageConnector(collector, quality, signature, axis);

  let tailPath;
  if (signature.tail.type === 'contractile') {
    addContractileTail(collector, quality, signature, axis);
  } else if (signature.tail.type === 'short') {
    addShortTail(collector, quality, signature, axis);
  } else {
    tailPath = addNoncontractileTail(collector, quality, signature, axis);
  }

  addDistalArchitecture(collector, quality, signature, axis, tailPath);
  collector.root.userData.phageArchitecture = true;
  collector.root.userData.phageProfileId = collector.signature?.profileId;
  collector.root.userData.phageHeadShape = signature.head.shape;
  collector.root.userData.phageTailType = signature.tail.type;
}

function requirePhageSignature(collector: ModelCollector): PhageStructuralSignature {
  const signature = collector.signature?.phage;
  if (!signature) {
    throw new Error(
      `Missing phage structural signature for ${collector.definition.id}`,
    );
  }
  return signature;
}
