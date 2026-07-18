import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getPressTemplate } from '../../data/presses';
import { resolveMoldTemplate } from '../../data/molds';
import { getMaterial, MATERIALS } from '../../data/materials';
import type { ProcessRange } from '../../sim/entities/material';
import type { ProcessParams } from '../../sim/entities/press';
import type { Company } from '../../sim/entities/company';
import { requiredTonnage } from '../../sim/entities/mold';
import { repairCost, preventiveCost } from '../../sim/systems/maintenanceSystem';
import { AUTOMATION_UPGRADE_COST } from '../../sim/systems/financeSystem';
import { formatCurrency, formatPercent, PRESS_STATE_LABELS, MATERIAL_FAMILY_LABELS } from '../format';

function ParamSlider({
  label, unit, range, value, onChange,
}: { label: string; unit: string; range: ProcessRange; value: number; onChange: (v: number) => void }) {
  const inRange = value >= range.idealMin && value <= range.idealMax;
  return (
    <label className="param-slider">
      <div className="param-slider__head">
        <span>{label}</span>
        <span className={inRange ? 'param-slider__value--ok' : 'param-slider__value--warn'}>{Math.round(value)} {unit}</span>
      </div>
      <input
        type="range"
        min={range.acceptMin}
        max={range.acceptMax}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="param-slider__ideal">Idéal : {range.idealMin}–{range.idealMax} {unit}</div>
    </label>
  );
}

export function MachineTuningPanel() {
  useGameStore((s) => s.tickCount);
  const { company, selectedFactoryId, assignPress, setPressParams, repairPress, maintainPress, automatePress } = useGameStore.getState();
  const factory = company.factories.find((f) => f.id === selectedFactoryId);
  const [selectedPressId, setSelectedPressId] = useState<string | null>(null);

  if (!factory) return null;
  const press = factory.presses.find((p) => p.id === selectedPressId) ?? factory.presses[0] ?? null;

  return (
    <div className="panel">
      <h2>Réglage des presses</h2>

      <div className="press-tabs">
        {factory.presses.map((p) => (
          <button
            key={p.id}
            className={p.id === press?.id ? 'press-tab press-tab--active' : 'press-tab'}
            onClick={() => setSelectedPressId(p.id)}
          >
            {getPressTemplate(p.templateId).name}
          </button>
        ))}
      </div>

      {!press && <p className="empty">Achetez une presse dans l'onglet Finances.</p>}

      {press && (
        <div className="machine-detail">
          <div className="machine-detail__status">
            <span>État : {PRESS_STATE_LABELS[press.state]}</span>
            <span>Usure : {formatPercent(press.wear)}</span>
            <span>Cycles : {press.cyclesRun}</span>
            <span>En attente de livraison : {press.pendingGoodUnits}</span>
          </div>

          {press.state === 'fault' && (
            <div className="alert alert--danger">
              {press.faultReason}
              <button onClick={() => repairPress(factory.id, press.id)}>
                Réparer ({formatCurrency(repairCost(press))})
              </button>
            </div>
          )}
          {press.state !== 'fault' && press.wear > 0.35 && (
            <div className="alert alert--warn">
              Usure élevée, une maintenance préventive limitera le risque de panne.
              <button onClick={() => maintainPress(factory.id, press.id)}>
                Entretien préventif ({formatCurrency(preventiveCost(press))})
              </button>
            </div>
          )}

          <div className="machine-detail__status">
            {press.automated ? (
              <span className="param-slider__value--ok">Automatisée (fonctionne sans opérateur)</span>
            ) : (
              <button
                disabled={!company.researchedTechIds.includes('automation_1') || company.cash < AUTOMATION_UPGRADE_COST}
                onClick={() => automatePress(factory.id, press.id)}
              >
                Automatiser ({formatCurrency(AUTOMATION_UPGRADE_COST)})
              </button>
            )}
          </div>

          <div className="assign-grid">
            <label>
              Moule
              <select
                value={press.moldId ?? ''}
                onChange={(e) => assignPress(factory.id, press.id, { moldId: e.target.value || null })}
              >
                <option value="">— Aucun —</option>
                {factory.molds.map((m) => (
                  <option key={m.id} value={m.id}>{resolveMoldTemplate(company, m.templateId).partName} (usure {formatPercent(m.wear)})</option>
                ))}
              </select>
            </label>

            <label>
              Matière
              <select
                value={press.materialId ?? ''}
                onChange={(e) => assignPress(factory.id, press.id, { materialId: e.target.value || null })}
              >
                <option value="">— Aucune —</option>
                {MATERIALS.filter((mat) => !mat.requiresTechId || company.researchedTechIds.includes(mat.requiresTechId)).map((mat) => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name} · {MATERIAL_FAMILY_LABELS[mat.family]} ({(factory.materialStockKg[mat.id] ?? 0).toFixed(0)} kg en stock)
                  </option>
                ))}
              </select>
            </label>

            <label>
              Opérateur
              <select
                value={press.operatorId ?? ''}
                onChange={(e) => assignPress(factory.id, press.id, { operatorId: e.target.value || null })}
              >
                <option value="">— Aucun —</option>
                {factory.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.shift})</option>
                ))}
              </select>
            </label>

            <label>
              Contrat
              <select
                value={press.contractId ?? ''}
                onChange={(e) => assignPress(factory.id, press.id, { contractId: e.target.value || null })}
              >
                <option value="">— Aucun —</option>
                {factory.activeContracts.map((c) => (
                  <option key={c.id} value={c.id}>{c.clientName} ({c.producedGood}/{c.quantity})</option>
                ))}
              </select>
            </label>
          </div>

          {press.moldId && (
            <ClampWarning company={company} pressTemplateId={press.templateId} moldTemplateId={factory.molds.find((m) => m.id === press.moldId)?.templateId} />
          )}

          {press.materialId ? (
            <ProcessSliders
              params={press.params}
              materialId={press.materialId}
              onChange={(patch) => setPressParams(factory.id, press.id, patch)}
            />
          ) : (
            <p className="empty">Assignez une matière pour régler les paramètres process.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ClampWarning({ company, pressTemplateId, moldTemplateId }: { company: Company; pressTemplateId: string; moldTemplateId?: string }) {
  if (!moldTemplateId) return null;
  const pressTemplate = getPressTemplate(pressTemplateId);
  const moldTemplate = resolveMoldTemplate(company, moldTemplateId);
  const required = requiredTonnage(moldTemplate);
  if (required > pressTemplate.tonnage) {
    return (
      <div className="alert alert--danger">
        Force de fermeture insuffisante : ce moule requiert ≈{Math.round(required)} T contre {pressTemplate.tonnage} T disponibles — risque élevé de bavure.
      </div>
    );
  }
  return null;
}

function ProcessSliders({
  params, materialId, onChange,
}: { params: ProcessParams; materialId: string; onChange: (patch: Partial<ProcessParams>) => void }) {
  const material = getMaterial(materialId);
  return (
    <div className="process-sliders">
      <ParamSlider label="Température matière" unit="°C" range={material.meltTemp} value={params.meltTemp} onChange={(v) => onChange({ meltTemp: v })} />
      <ParamSlider label="Température moule" unit="°C" range={material.moldTemp} value={params.moldTemp} onChange={(v) => onChange({ moldTemp: v })} />
      <ParamSlider label="Pression d'injection" unit="bar" range={material.injectionPressure} value={params.injectionPressure} onChange={(v) => onChange({ injectionPressure: v })} />
      <ParamSlider label="Vitesse d'injection" unit="mm/s" range={material.injectionSpeed} value={params.injectionSpeed} onChange={(v) => onChange({ injectionSpeed: v })} />
      <ParamSlider label="Temps de refroidissement" unit="s" range={material.coolingTime} value={params.coolingTime} onChange={(v) => onChange({ coolingTime: v })} />
    </div>
  );
}
