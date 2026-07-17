export interface Competitor {
  id: string;
  name: string;
  /** 0..1 — overall aggressiveness in bidding. */
  strength: number;
  /** MoldFamily id this rival is especially aggressive in. */
  specialtyFamilyId: string;
}

export const COMPETITORS: Competitor[] = [
  { id: 'riv_plastigroup', name: 'PlastiGroupe SA', strength: 0.55, specialtyFamilyId: 'cap' },
  { id: 'riv_technimold', name: 'Technimoule Industries', strength: 0.65, specialtyFamilyId: 'housing' },
  { id: 'riv_novapack', name: 'NovaPack', strength: 0.45, specialtyFamilyId: 'toy' },
];
