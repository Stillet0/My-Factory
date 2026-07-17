import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { MATERIALS } from '../../data/materials';
import { resolveMoldTemplate } from '../../data/molds';
import { transferMaterialCost, MOLD_TRANSFER_COST, TRANSIT_DAYS } from '../../sim/systems/financeSystem';
import { formatCurrency } from '../format';

export function LogisticsPanel() {
  useGameStore((s) => s.tickCount);
  const { company, selectedFactoryId, clock, transferMaterial, transferMold } = useGameStore.getState();
  const source = company.factories.find((f) => f.id === selectedFactoryId);
  const otherFactories = company.factories.filter((f) => f.id !== selectedFactoryId);

  const [destFactoryId, setDestFactoryId] = useState(otherFactories[0]?.id ?? '');
  const [materialId, setMaterialId] = useState(MATERIALS[0].id);
  const [kg, setKg] = useState(100);
  const [moldId, setMoldId] = useState('');

  if (!source) return null;
  const dest = otherFactories.find((f) => f.id === destFactoryId) ?? otherFactories[0];

  const stockAvailable = source.materialStockKg[materialId] ?? 0;
  const materialCost = transferMaterialCost(kg);
  const availableMolds = source.molds.filter((m) => !source.presses.some((p) => p.moldId === m.id));

  if (otherFactories.length === 0) {
    return (
      <div className="panel">
        <h2>Logistique</h2>
        <p className="empty">Fondez une deuxième usine pour activer le transfert inter-usines.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Logistique</h2>
      <p className="empty">Expédition depuis {source.name}. Délai de transport : {TRANSIT_DAYS} j.</p>

      <h3>Transférer de la matière première</h3>
      <div className="assign-grid">
        <label>
          Destination
          <select value={dest?.id ?? ''} onChange={(e) => setDestFactoryId(e.target.value)}>
            {otherFactories.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </label>
        <label>
          Matière
          <select value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
            {MATERIALS.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({(source.materialStockKg[m.id] ?? 0).toFixed(0)} kg dispo)</option>
            ))}
          </select>
        </label>
      </div>
      <div className="loan-form">
        <input type="number" min={10} step={10} value={kg} onChange={(e) => setKg(Number(e.target.value))} />
        <button
          disabled={kg <= 0 || kg > stockAvailable || company.cash < materialCost || !dest}
          onClick={() => dest && transferMaterial(source.id, dest.id, materialId, kg)}
        >
          Expédier ({formatCurrency(materialCost)})
        </button>
      </div>

      <h3>Transférer un moule</h3>
      {availableMolds.length === 0 ? (
        <p className="empty">Aucun moule disponible (tous montés sur une presse).</p>
      ) : (
        <>
          <div className="assign-grid">
            <label>
              Moule
              <select value={moldId || availableMolds[0].id} onChange={(e) => setMoldId(e.target.value)}>
                {availableMolds.map((m) => (
                  <option key={m.id} value={m.id}>{resolveMoldTemplate(company, m.templateId).partName}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            disabled={company.cash < MOLD_TRANSFER_COST || !dest}
            onClick={() => dest && transferMold(source.id, dest.id, moldId || availableMolds[0].id)}
          >
            Expédier ({formatCurrency(MOLD_TRANSFER_COST)})
          </button>
        </>
      )}

      <h3>Expéditions en cours (vers {source.name})</h3>
      <ul className="contract-list">
        {source.incomingMaterialShipments.map((s) => {
          const remaining = Math.max(0, s.arrivalDay - clock.day);
          return (
            <li key={s.id} className="contract-card">
              <span>{s.kg} kg — arrivée dans {remaining} j</span>
            </li>
          );
        })}
        {source.incomingMoldTransfers.map((t) => {
          const remaining = Math.max(0, t.arrivalDay - clock.day);
          return (
            <li key={t.id} className="contract-card">
              <span>Moule ({resolveMoldTemplate(company, t.mold.templateId).partName}) — arrivée dans {remaining} j</span>
            </li>
          );
        })}
        {source.incomingMaterialShipments.length === 0 && source.incomingMoldTransfers.length === 0 && (
          <li className="empty">Aucune expédition en cours vers cette usine.</li>
        )}
      </ul>
    </div>
  );
}
