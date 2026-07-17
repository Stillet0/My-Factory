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
  { id: 'riv_hydrapack', name: 'Hydrapack', strength: 0.5, specialtyFamilyId: 'bottle' },
  { id: 'riv_medipharm', name: 'MédiPharm Composants', strength: 0.6, specialtyFamilyId: 'medical_pipette' },
  { id: 'riv_autoform', name: 'AutoForm Composants', strength: 0.7, specialtyFamilyId: 'automotive_bracket' },
];
