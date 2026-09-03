import type { CombinationRepresentation } from './representations';
import type { AdvancedRepresentationId } from './types';

/**
 * Experimental representations stay opt-in. Registering one does not place it in
 * the production algorithm menu until its own validation and UI work is complete.
 */
export class AdvancedRepresentationRegistry {
  private readonly items = new Map<
    AdvancedRepresentationId,
    CombinationRepresentation
  >();

  register(
    id: AdvancedRepresentationId,
    representation: CombinationRepresentation,
  ): void {
    if (representation.id !== id) {
      throw new Error('Advanced representation ID가 등록 슬롯과 일치하지 않아요.');
    }
    if (this.items.has(id)) {
      throw new Error(`${id} representation은 이미 등록되어 있어요.`);
    }
    this.items.set(id, representation);
  }

  get(id: AdvancedRepresentationId): CombinationRepresentation | undefined {
    return this.items.get(id);
  }

  list(): readonly CombinationRepresentation[] {
    return [...this.items.values()];
  }
}

export const advancedRepresentationRegistry = new AdvancedRepresentationRegistry();
