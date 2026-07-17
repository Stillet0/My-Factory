export type TechCategory = 'presses' | 'automation' | 'materials' | 'quality';

export interface TechNode {
  id: string;
  name: string;
  description: string;
  category: TechCategory;
  cost: number;
  researchDays: number;
  prerequisiteIds: string[];
}

export const TECH_TREE: TechNode[] = [
  {
    id: 'press_400t',
    name: 'Presse 400T',
    description: 'Débloque l’achat de la presse 400T pour les grosses pièces.',
    category: 'presses',
    cost: 40000,
    researchDays: 10,
    prerequisiteIds: [],
  },
  {
    id: 'automation_1',
    name: 'Robots de reprise',
    description: 'Permet d’automatiser une presse : elle tourne sans opérateur assigné.',
    category: 'automation',
    cost: 55000,
    researchDays: 14,
    prerequisiteIds: [],
  },
  {
    id: 'automation_2',
    name: 'Cellules robotisées avancées',
    description: 'Automatisation de nouvelle génération : réduit le malus qualité des presses automatisées.',
    category: 'automation',
    cost: 70000,
    researchDays: 16,
    prerequisiteIds: ['automation_1'],
  },
  {
    id: 'material_pa66',
    name: 'Polyamide PA66',
    description: 'Débloque le PA66, une matière technique haute résistance.',
    category: 'materials',
    cost: 30000,
    researchDays: 8,
    prerequisiteIds: [],
  },
  {
    id: 'material_tpe',
    name: 'TPE (élastomère)',
    description: 'Débloque le TPE pour des pièces souples/surmoulées.',
    category: 'materials',
    cost: 25000,
    researchDays: 7,
    prerequisiteIds: [],
  },
  {
    id: 'material_pmma',
    name: 'PMMA (Plexiglas)',
    description: 'Débloque le PMMA pour des pièces transparentes de précision.',
    category: 'materials',
    cost: 28000,
    researchDays: 7,
    prerequisiteIds: [],
  },
  {
    id: 'material_pom',
    name: 'POM (Acétal)',
    description: 'Débloque le POM, une matière de précision pour pièces mécaniques et médicales.',
    category: 'materials',
    cost: 38000,
    researchDays: 9,
    prerequisiteIds: [],
  },
  {
    id: 'quality_iso9001',
    name: 'Certification ISO 9001',
    description: 'Certification qualité reconnue ; améliore durablement la réputation.',
    category: 'quality',
    cost: 35000,
    researchDays: 12,
    prerequisiteIds: [],
  },
  {
    id: 'quality_iatf',
    name: 'Certification IATF 16949 (automobile)',
    description: 'Certification qualité automobile.',
    category: 'quality',
    cost: 60000,
    researchDays: 18,
    prerequisiteIds: ['quality_iso9001'],
  },
  {
    id: 'quality_iso14001',
    name: 'Certification ISO 14001',
    description: 'Certification environnementale ; améliore la réputation.',
    category: 'quality',
    cost: 32000,
    researchDays: 10,
    prerequisiteIds: [],
  },
  {
    id: 'quality_fda',
    name: 'Certification agroalimentaire (FDA)',
    description: 'Certification contact alimentaire ; améliore la réputation.',
    category: 'quality',
    cost: 45000,
    researchDays: 14,
    prerequisiteIds: ['quality_iso9001'],
  },
  {
    id: 'quality_ce_medical',
    name: 'Marquage CE médical',
    description: 'Certification dispositifs médicaux ; améliore la réputation.',
    category: 'quality',
    cost: 55000,
    researchDays: 16,
    prerequisiteIds: ['quality_iso9001'],
  },
  {
    id: 'press_600t',
    name: 'Presse 600T',
    description: 'Débloque l’achat de la presse 600T pour les pièces massives.',
    category: 'presses',
    cost: 90000,
    researchDays: 16,
    prerequisiteIds: ['press_400t'],
  },
];

export function getTechNode(id: string): TechNode {
  const n = TECH_TREE.find((t) => t.id === id);
  if (!n) throw new Error(`Unknown tech node ${id}`);
  return n;
}
