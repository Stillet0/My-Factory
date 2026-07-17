import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { MOLD_FAMILIES, getMoldFamily, type ToolingTier } from '../../data/moldFamilies';
import { getMaterial } from '../../data/materials';
import { resolveMoldTemplate } from '../../data/molds';
import { computeCustomMoldStats } from '../../sim/formulas/moldDesign';
import { formatCurrency, TOOLING_TIER_LABELS } from '../format';

function availableMaterialsFor(family: { compatibleMaterialIds: string[] }, researchedTechIds: string[]): string[] {
  return family.compatibleMaterialIds.filter((id) => {
    const techId = getMaterial(id).requiresTechId;
    return !techId || researchedTechIds.includes(techId);
  });
}

export function MoldDesignPanel() {
  useGameStore((s) => s.tickCount);
  const { company, selectedFactoryId, clock, designMold } = useGameStore.getState();
  const factory = company.factories.find((f) => f.id === selectedFactoryId);

  const [familyId, setFamilyId] = useState(MOLD_FAMILIES[0].id);
  const family = getMoldFamily(familyId);
  const [cavities, setCavities] = useState(family.baseCavities);
  const [tier, setTier] = useState<ToolingTier>('standard');
  const [materialIds, setMaterialIds] = useState<string[]>(availableMaterialsFor(family, company.researchedTechIds));

  if (!factory) return null;

  const availableMaterials = availableMaterialsFor(family, company.researchedTechIds);
  const selectedMaterialIds = materialIds.filter((id) => availableMaterials.includes(id));
  const stats = computeCustomMoldStats(family, cavities, tier);
  const requiredTonnes = Math.round(family.projectedAreaCm2 * cavities * 0.4);

  function handleFamilyChange(id: string) {
    const f = getMoldFamily(id);
    setFamilyId(id);
    setCavities(f.baseCavities);
    setMaterialIds(availableMaterialsFor(f, company.researchedTechIds));
  }

  function toggleMaterial(id: string) {
    setMaterialIds((cur) => (cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id]));
  }

  return (
    <div className="panel">
      <h2>Bureau d'étude</h2>

      <div className="assign-grid">
        <label>
          Famille de pièce
          <select value={familyId} onChange={(e) => handleFamilyChange(e.target.value)}>
            {MOLD_FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>{f.partName}</option>
            ))}
          </select>
        </label>

        <label>
          Nombre d'empreintes
          <select value={cavities} onChange={(e) => setCavities(Number(e.target.value))}>
            {family.allowedCavities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label>
          Précision de l'outillage
          <select value={tier} onChange={(e) => setTier(e.target.value as ToolingTier)}>
            {(Object.keys(TOOLING_TIER_LABELS) as ToolingTier[]).map((t) => (
              <option key={t} value={t}>{TOOLING_TIER_LABELS[t]}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="material-checkboxes">
        {availableMaterials.map((id) => (
          <label key={id}>
            <input type="checkbox" checked={selectedMaterialIds.includes(id)} onChange={() => toggleMaterial(id)} /> {getMaterial(id).name}
          </label>
        ))}
        {availableMaterials.length === 0 && <span className="empty">Aucune matière compatible débloquée pour cette famille.</span>}
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Coût de conception</span>
          <span className="stat-value">{formatCurrency(stats.buildCostBase)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Délai de fabrication</span>
          <span className="stat-value">{stats.buildTimeDaysBase} j</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Tonnage requis</span>
          <span className="stat-value">{requiredTonnes} T</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Facteur de complexité</span>
          <span className="stat-value">{stats.complexityFactor}</span>
        </div>
      </div>

      <button
        disabled={selectedMaterialIds.length === 0 || company.cash < stats.buildCostBase}
        onClick={() => designMold(factory.id, { familyId, cavities, tier, materialIds: selectedMaterialIds })}
      >
        Lancer la conception
      </button>

      <h3>File de fabrication</h3>
      <ul className="contract-list">
        {factory.moldsInProgress.map((entry) => {
          const template = resolveMoldTemplate(company, entry.templateId);
          const remaining = Math.max(0, entry.readyOnDay - clock.day);
          const progress = 1 - remaining / Math.max(1, template.buildTimeDaysBase);
          return (
            <li key={entry.id} className="contract-card">
              <div className="contract-card__header">
                <strong>{template.partName}</strong>
                <span>{remaining} j restants</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar__fill" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
              </div>
            </li>
          );
        })}
        {factory.moldsInProgress.length === 0 && <li className="empty">Aucune fabrication en cours.</li>}
      </ul>

      <h3>Moules personnalisés conçus</h3>
      <ul className="shop-list">
        {company.customMoldTemplates.map((t) => (
          <li key={t.id} className="shop-item">
            <span>{t.partName} — {t.cavities} empr., complexité {t.complexityFactor}, usure ×{t.wearRateMult}</span>
          </li>
        ))}
        {company.customMoldTemplates.length === 0 && <li className="empty">Aucun moule personnalisé conçu pour l'instant.</li>}
      </ul>
    </div>
  );
}
