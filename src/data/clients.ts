export interface ClientArchetype {
  id: string;
  name: string;
  /** MoldFamily id (data/moldFamilies.ts) — any mold of this family fulfills the contract. */
  familyId: string;
  /** Price multiplier applied to the mold's sellPricePerUnitBase. */
  priceMultMin: number;
  priceMultMax: number;
  /** Minimum company reputation required before this client appears. */
  reputationGate: number;
}

export const CLIENT_ARCHETYPES: ClientArchetype[] = [
  {
    id: 'cl_bottler',
    name: 'Embouteilleur régional',
    familyId: 'cap',
    priceMultMin: 0.9,
    priceMultMax: 1.1,
    reputationGate: 0,
  },
  {
    id: 'cl_homegoods',
    name: 'Distributeur d’articles ménagers',
    familyId: 'lid',
    priceMultMin: 0.95,
    priceMultMax: 1.15,
    reputationGate: 0.1,
  },
  {
    id: 'cl_electronics',
    name: 'Fabricant électronique',
    familyId: 'housing',
    priceMultMin: 1.0,
    priceMultMax: 1.3,
    reputationGate: 0.3,
  },
  {
    id: 'cl_toys',
    name: 'Marque de jouets',
    familyId: 'toy',
    priceMultMin: 0.9,
    priceMultMax: 1.2,
    reputationGate: 0.15,
  },
  {
    id: 'cl_beverage',
    name: 'Embouteilleur de boissons',
    familyId: 'bottle',
    priceMultMin: 0.9,
    priceMultMax: 1.1,
    reputationGate: 0.05,
  },
  {
    id: 'cl_foodpack',
    name: 'Conditionneur agroalimentaire',
    familyId: 'tray',
    priceMultMin: 0.85,
    priceMultMax: 1.05,
    reputationGate: 0.1,
  },
  {
    id: 'cl_automotive',
    name: 'Équipementier automobile',
    familyId: 'automotive_bracket',
    priceMultMin: 1.0,
    priceMultMax: 1.25,
    reputationGate: 0.4,
  },
  {
    id: 'cl_mobile_accessories',
    name: 'Fabricant d’accessoires mobiles',
    familyId: 'phone_case',
    priceMultMin: 0.95,
    priceMultMax: 1.2,
    reputationGate: 0.2,
  },
  {
    id: 'cl_medical',
    name: 'Fournisseur médical',
    familyId: 'medical_pipette',
    priceMultMin: 1.0,
    priceMultMax: 1.3,
    reputationGate: 0.35,
  },
  {
    id: 'cl_furniture',
    name: 'Fabricant de mobilier extérieur',
    familyId: 'garden_chair',
    priceMultMin: 0.9,
    priceMultMax: 1.15,
    reputationGate: 0.15,
  },
  {
    id: 'cl_electrical',
    name: 'Fabricant de matériel électrique',
    familyId: 'electrical_insulator',
    priceMultMin: 0.9,
    priceMultMax: 1.15,
    reputationGate: 0.25,
  },
  {
    id: 'cl_seals',
    name: 'Fournisseur de joints industriels',
    familyId: 'rubber_seal',
    priceMultMin: 0.85,
    priceMultMax: 1.1,
    reputationGate: 0.2,
  },
];
