import { describe, it, expect } from 'vitest';
import { MOLD_FAMILIES } from './moldFamilies';
import { MOLD_TEMPLATES } from './molds';
import { MATERIALS, getMaterial } from './materials';
import { CLIENT_ARCHETYPES } from './clients';
import { TECH_TREE, getTechNode } from './techtree';
import { COMPETITORS } from './competitors';
import { PRESSES } from './presses';

/** Cross-checks every data catalog for dangling references — cheap
 * insurance against typos as content keeps growing (family ids, material
 * ids, tech prerequisites, etc. are all plain strings with no compiler
 * checking that they actually resolve to something). */
describe('content integrity', () => {
  const familyIds = new Set(MOLD_FAMILIES.map((f) => f.id));
  const materialIds = new Set(MATERIALS.map((m) => m.id));
  const techIds = new Set(TECH_TREE.map((t) => t.id));

  it('every mold family only references materials that exist', () => {
    for (const family of MOLD_FAMILIES) {
      for (const materialId of family.compatibleMaterialIds) {
        expect(materialIds.has(materialId), `family ${family.id} -> unknown material ${materialId}`).toBe(true);
      }
      expect(family.allowedCavities).toContain(family.baseCavities);
    }
  });

  it('every catalog mold template references a real family and only compatible materials', () => {
    for (const template of MOLD_TEMPLATES) {
      expect(familyIds.has(template.familyId), `template ${template.id} -> unknown family ${template.familyId}`).toBe(true);
      const family = MOLD_FAMILIES.find((f) => f.id === template.familyId)!;
      for (const materialId of template.compatibleMaterialIds) {
        expect(materialIds.has(materialId), `template ${template.id} -> unknown material ${materialId}`).toBe(true);
        expect(family.compatibleMaterialIds).toContain(materialId);
      }
    }
  });

  it('every client archetype references a real mold family', () => {
    for (const archetype of CLIENT_ARCHETYPES) {
      expect(familyIds.has(archetype.familyId), `client ${archetype.id} -> unknown family ${archetype.familyId}`).toBe(true);
    }
  });

  it('every tech prerequisite points to another real tech node', () => {
    for (const node of TECH_TREE) {
      for (const prereqId of node.prerequisiteIds) {
        expect(techIds.has(prereqId), `tech ${node.id} -> unknown prerequisite ${prereqId}`).toBe(true);
        expect(() => getTechNode(prereqId)).not.toThrow();
      }
    }
  });

  it('every requiresTechId on a material/press resolves to a real tech node', () => {
    for (const material of MATERIALS) {
      if (material.requiresTechId) {
        expect(techIds.has(material.requiresTechId), `material ${material.id} -> unknown tech ${material.requiresTechId}`).toBe(true);
      }
    }
    for (const press of PRESSES) {
      if (press.requiresTechId) {
        expect(techIds.has(press.requiresTechId), `press ${press.id} -> unknown tech ${press.requiresTechId}`).toBe(true);
      }
    }
  });

  it('every competitor specialty references a real mold family', () => {
    for (const rival of COMPETITORS) {
      expect(familyIds.has(rival.specialtyFamilyId), `competitor ${rival.id} -> unknown family ${rival.specialtyFamilyId}`).toBe(true);
    }
  });

  it('getMaterial/getTechNode resolve every id referenced anywhere without throwing', () => {
    for (const id of materialIds) expect(() => getMaterial(id)).not.toThrow();
    for (const id of techIds) expect(() => getTechNode(id)).not.toThrow();
  });

  it('every material has a valid thermoplastic/thermoset family tag', () => {
    for (const material of MATERIALS) {
      expect(['thermoplastic', 'thermoset']).toContain(material.family);
    }
  });

  it('every thermoset material is gated behind the thermoset process tech (directly or via prerequisite)', () => {
    for (const material of MATERIALS.filter((m) => m.family === 'thermoset')) {
      expect(material.requiresTechId, `thermoset material ${material.id} has no requiresTechId`).toBeDefined();
      const node = getTechNode(material.requiresTechId!);
      const gatedByProcess = node.id === 'process_thermoset' || node.prerequisiteIds.includes('process_thermoset');
      expect(gatedByProcess, `thermoset material ${material.id} -> tech ${node.id} doesn't require process_thermoset`).toBe(true);
    }
  });

  it('every tech node category is one of the known categories', () => {
    const validCategories = ['presses', 'automation', 'materials', 'quality', 'molds'];
    for (const node of TECH_TREE) {
      expect(validCategories).toContain(node.category);
    }
  });
});
