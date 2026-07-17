export type ContractStatus = 'offered' | 'active' | 'completed' | 'failed';

export interface Contract {
  id: string;
  clientName: string;
  moldTemplateId: string;
  quantity: number;
  producedGood: number;
  producedReject: number;
  pricePerUnit: number;
  /** Simulated ms timestamp by which the order must be fully delivered. */
  deadlineMs: number;
  /** Minimum fraction of good (non-rejected) parts required, else penalty. */
  minQualityRatio: number;
  status: ContractStatus;
  offeredOnMs: number;
  penaltyPerMissingUnit: number;
}

let contractSeq = 0;
export function nextContractId(): string {
  contractSeq++;
  return `ct_${contractSeq}`;
}

export function isComplete(c: Contract): boolean {
  return c.producedGood >= c.quantity;
}
