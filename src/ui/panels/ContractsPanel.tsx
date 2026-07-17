import { useGameStore } from '../../store/gameStore';
import { getMoldFamily } from '../../data/moldFamilies';
import { DAY_LENGTH_MS } from '../../sim/clock';
import { formatCurrency, formatPercent } from '../format';

export function ContractsPanel() {
  useGameStore((s) => s.tickCount);
  const { company, selectedFactoryId, clock, acceptContract } = useGameStore.getState();
  const factory = company.factories.find((f) => f.id === selectedFactoryId);
  if (!factory) return null;

  return (
    <div className="panel">
      <h2>Contrats</h2>

      <h3>Offres disponibles</h3>
      <ul className="contract-list">
        {factory.availableContracts.map((c) => {
          const part = getMoldFamily(c.familyId);
          const daysLeft = Math.max(0, Math.round((c.deadlineMs - clock.simTimeMs) / DAY_LENGTH_MS));
          return (
            <li key={c.id} className="contract-card">
              <div className="contract-card__header">
                <strong>{c.clientName}</strong>
                <span>{formatCurrency(c.quantity * c.pricePerUnit)}</span>
              </div>
              <div className="contract-card__body">
                <span>{part.partName} × {c.quantity.toLocaleString('fr-FR')}</span>
                <span>{c.pricePerUnit.toFixed(2)} €/pièce</span>
                <span>Qualité min. {formatPercent(c.minQualityRatio)}</span>
                <span>Délai ≈ {daysLeft} j</span>
              </div>
              <button onClick={() => acceptContract(factory.id, c.id)}>Accepter</button>
            </li>
          );
        })}
        {factory.availableContracts.length === 0 && <li className="empty">Aucune offre pour le moment — repassez bientôt.</li>}
      </ul>

      <h3>Contrats en cours</h3>
      <ul className="contract-list">
        {factory.activeContracts.map((c) => {
          const part = getMoldFamily(c.familyId);
          const progress = c.quantity > 0 ? c.producedGood / c.quantity : 0;
          const daysLeft = ((c.deadlineMs - clock.simTimeMs) / DAY_LENGTH_MS).toFixed(1);
          return (
            <li key={c.id} className="contract-card">
              <div className="contract-card__header">
                <strong>{c.clientName}</strong>
                <span>{part.partName}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar__fill" style={{ width: `${Math.min(100, progress * 100)}%` }} />
              </div>
              <div className="contract-card__body">
                <span>{c.producedGood}/{c.quantity} bonnes ({c.producedReject} rebuts)</span>
                <span>Échéance dans {daysLeft} j</span>
              </div>
            </li>
          );
        })}
        {factory.activeContracts.length === 0 && <li className="empty">Aucun contrat actif — acceptez une offre.</li>}
      </ul>
    </div>
  );
}
