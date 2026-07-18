export type ContractStatus = 'offered' | 'active' | 'cancelled';

/** A standing price agreement with a client, not a one-off order: once
 * signed it produces indefinitely at pricePerUnit until the player cancels
 * it (or replaces it with a better-paying offer). */
export interface Contract {
  id: string;
  clientName: string;
  /** MoldFamily id — fulfillable by any mold (catalog or custom) of this family. */
  familyId: string;
  pricePerUnit: number;
  status: ContractStatus;
  offeredOnMs: number;
  /** Lifetime units sold/rejected under this contract — informational only. */
  producedGood: number;
  producedReject: number;
}

let contractSeq = 0;
export function nextContractId(): string {
  contractSeq++;
  return `ct_${contractSeq}`;
}
