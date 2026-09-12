import { VIRUS_CATALOG } from '../registry';
import { getStructureSource } from '../sources';
import { getStructuralSignature } from '../structuralSignatures';
import type { ObservationDefinition } from '../types';
import { getStructureExplanation } from './registry';
import type { StructureExplanation, StructureExplanationTarget } from './types';

export type ExplanationAuditSeverity = 'error' | 'warning';

export type ExplanationAuditCode =
  | 'missing-signature'
  | 'missing-explanation'
  | 'generic-fallback'
  | 'empty-field'
  | 'invalid-source'
  | 'invalid-source-url'
  | 'evidence-overclaim'
  | 'source-signature-mismatch'
  | 'long-field';

export interface ExplanationAuditIssue {
  readonly severity: ExplanationAuditSeverity;
  readonly code: ExplanationAuditCode;
  readonly virusId: string;
  readonly target?: StructureExplanationTarget;
  readonly detail: string;
}

export interface ExplanationAuditRow {
  readonly virusId: string;
  readonly targetCount: number;
  readonly entryCount: number;
  readonly familyCount: number;
  readonly genericCount: number;
  readonly status: 'PASS' | 'REVIEW' | 'FAIL';
}

export interface ExplanationAuditReport {
  readonly rows: readonly ExplanationAuditRow[];
  readonly issues: readonly ExplanationAuditIssue[];
  readonly totals: {
    readonly viruses: number;
    readonly targets: number;
    readonly entry: number;
    readonly family: number;
    readonly generic: number;
    readonly errors: number;
    readonly warnings: number;
  };
}

const MAX_FIELD_LENGTH = 120;

export function auditStructureExplanations(): ExplanationAuditReport {
  const issues: ExplanationAuditIssue[] = [];
  const rows = VIRUS_CATALOG.map((definition) => auditDefinition(definition, issues));

  return {
    rows,
    issues,
    totals: {
      viruses: rows.length,
      targets: rows.reduce((sum, row) => sum + row.targetCount, 0),
      entry: rows.reduce((sum, row) => sum + row.entryCount, 0),
      family: rows.reduce((sum, row) => sum + row.familyCount, 0),
      generic: rows.reduce((sum, row) => sum + row.genericCount, 0),
      errors: issues.filter(({ severity }) => severity === 'error').length,
      warnings: issues.filter(({ severity }) => severity === 'warning').length,
    },
  };
}

function auditDefinition(
  definition: ObservationDefinition,
  issues: ExplanationAuditIssue[],
): ExplanationAuditRow {
  const start = issues.length;
  const signature = getStructuralSignature(definition.id);
  if (!signature) {
    addIssue(
      issues,
      'error',
      'missing-signature',
      definition.id,
      undefined,
      '구조 signature가 없어요.',
    );
  }

  const counts = { entry: 0, family: 0, generic: 0 };
  const signatureLevels = new Set(signature?.evidence.map(({ level }) => level) ?? []);
  const signatureSources = new Set(
    signature?.evidence.flatMap(({ sourceIds }) => sourceIds) ?? [],
  );
  const targets = targetsFor(definition);

  for (const target of targets) {
    const explanation = getStructureExplanation(definition.id, target);
    if (!explanation) {
      addIssue(
        issues,
        'error',
        'missing-explanation',
        definition.id,
        target,
        '설명이 없어요.',
      );
      continue;
    }

    counts[explanation.scope] += 1;
    auditExplanation(
      definition.id,
      target,
      explanation,
      signatureLevels,
      signatureSources,
      issues,
    );
  }

  const ownIssues = issues.slice(start);
  return {
    virusId: definition.id,
    targetCount: targets.length,
    entryCount: counts.entry,
    familyCount: counts.family,
    genericCount: counts.generic,
    status: ownIssues.some(({ severity }) => severity === 'error')
      ? 'FAIL'
      : ownIssues.length > 0
        ? 'REVIEW'
        : 'PASS',
  };
}

function auditExplanation(
  virusId: string,
  target: StructureExplanationTarget,
  explanation: StructureExplanation,
  signatureLevels: ReadonlySet<string>,
  signatureSources: ReadonlySet<string>,
  issues: ExplanationAuditIssue[],
): void {
  if (explanation.scope === 'generic') {
    addIssue(
      issues,
      'warning',
      'generic-fallback',
      virusId,
      target,
      'generic 설명을 사용해요.',
    );
  }

  const fields = {
    genericSummary: explanation.genericSummary,
    actualName: explanation.actualName,
    role: explanation.role,
    location: explanation.location ?? '',
    relationships: explanation.relationships?.join(' ') ?? '',
    modelRepresentation: explanation.modelRepresentation,
    simplification: explanation.simplification ?? '',
  };
  for (const [field, text] of Object.entries(fields)) {
    if (!text.trim()) {
      addIssue(
        issues,
        'error',
        'empty-field',
        virusId,
        target,
        `${field}가 비어 있어요.`,
      );
    } else if (text.length > MAX_FIELD_LENGTH) {
      addIssue(
        issues,
        'warning',
        'long-field',
        virusId,
        target,
        `${field}가 ${text.length}자예요.`,
      );
    }
  }

  for (const sourceId of explanation.sourceIds) {
    const source = getStructureSource(sourceId);
    if (!source) {
      addIssue(issues, 'error', 'invalid-source', virusId, target, sourceId);
      continue;
    }
    if (!source.url.startsWith('https://') || source.url.includes('undefined')) {
      addIssue(issues, 'error', 'invalid-source-url', virusId, target, source.url);
    }
  }

  if (explanation.evidence === 'observed' && !signatureLevels.has('observed')) {
    addIssue(
      issues,
      'error',
      'evidence-overclaim',
      virusId,
      target,
      '설명은 observed지만 signature에는 observed 근거가 없어요.',
    );
  }
  if (!explanation.sourceIds.some((sourceId) => signatureSources.has(sourceId))) {
    addIssue(
      issues,
      'warning',
      'source-signature-mismatch',
      virusId,
      target,
      '설명과 signature가 공유하는 source ID가 없어요.',
    );
  }
}

function targetsFor(definition: ObservationDefinition): StructureExplanationTarget[] {
  return [
    ...definition.parts.map((id) => ({ kind: 'part' as const, id })),
    ...definition.layers.map(({ id }) => ({ kind: 'layer' as const, id })),
  ];
}

function addIssue(
  issues: ExplanationAuditIssue[],
  severity: ExplanationAuditSeverity,
  code: ExplanationAuditCode,
  virusId: string,
  target: StructureExplanationTarget | undefined,
  detail: string,
): void {
  issues.push({ severity, code, virusId, target, detail });
}
