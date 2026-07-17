export interface ClientArchetype {
  id: string;
  name: string;
  /** MoldFamily id (data/moldFamilies.ts) — any mold of this family fulfills the contract. */
  familyId: string;
  qtyMin: number;
  qtyMax: number;
  /** Price multiplier applied to the mold's sellPricePerUnitBase. */
  priceMultMin: number;
  priceMultMax: number;
  deadlineDaysMin: number;
  deadlineDaysMax: number;
  minQualityRatio: number;
  /** Minimum company reputation required before this client appears. */
  reputationGate: number;
}

export const CLIENT_ARCHETYPES: ClientArchetype[] = [
  {
    id: 'cl_bottler',
    name: 'Embouteilleur régional',
    familyId: 'cap',
    qtyMin: 5000,
    qtyMax: 20000,
    priceMultMin: 0.9,
    priceMultMax: 1.1,
    deadlineDaysMin: 5,
    deadlineDaysMax: 10,
    minQualityRatio: 0.9,
    reputationGate: 0,
  },
  {
    id: 'cl_homegoods',
    name: 'Distributeur d’articles ménagers',
    familyId: 'lid',
    qtyMin: 2000,
    qtyMax: 8000,
    priceMultMin: 0.95,
    priceMultMax: 1.15,
    deadlineDaysMin: 6,
    deadlineDaysMax: 12,
    minQualityRatio: 0.92,
    reputationGate: 0.1,
  },
  {
    id: 'cl_electronics',
    name: 'Fabricant électronique',
    familyId: 'housing',
    qtyMin: 500,
    qtyMax: 2500,
    priceMultMin: 1.0,
    priceMultMax: 1.3,
    deadlineDaysMin: 8,
    deadlineDaysMax: 16,
    minQualityRatio: 0.96,
    reputationGate: 0.3,
  },
  {
    id: 'cl_toys',
    name: 'Marque de jouets',
    familyId: 'toy',
    qtyMin: 1000,
    qtyMax: 6000,
    priceMultMin: 0.9,
    priceMultMax: 1.2,
    deadlineDaysMin: 7,
    deadlineDaysMax: 14,
    minQualityRatio: 0.9,
    reputationGate: 0.15,
  },
];
