import { useGameStore } from '../../store/gameStore';
import { getMoldFamily } from '../../data/moldFamilies';
import { formatCurrency, formatUnitPrice } from '../format';

export function ContractsPanel() {
  useGameStore((s) => s.tickCount);
  const { company, selectedFactoryId, acceptContract, cancelContract } = useGameStore.getState();
  const factory = company.factories.find((f) => f.id === selectedFactoryId);
  if (!factory) return null;

  const offers = [...factory.availableContracts].sort((a, b) => b.pricePerUnit - a.pricePerUnit);
  const active = [...factory.activeContracts].sort((a, b) => b.pricePerUnit - a.pricePerUnit);

  return (
    <div className="panel">
      <h2>Contrats</h2>
      <p className="panel__hint">
        Chaque contrat signé est un prix fixe payé instantanément pièce par pièce, sans quantité ni échéance — signez les
        mieux payés, annulez et resignez dès qu'une meilleure offre passe.
      </p>

      <h3>Offres du jour</h3>
      <ul className="contract-list">
        {offers.map((c) => {
          const part = getMoldFamily(c.familyId);
          return (
            <li key={c.id} className="contract-card">
              <div className="contract-card__header">
                <strong>{c.clientName}</strong>
                <span>{formatUnitPrice(c.pricePerUnit)}/pièce</span>
              </div>
              <div className="contract-card__body">
                <span>{part.partName}</span>
              </div>
              <button onClick={() => acceptContract(factory.id, c.id)}>Signer</button>
            </li>
          );
        })}
        {offers.length === 0 && <li className="empty">Aucune offre pour le moment — repassez demain.</li>}
      </ul>

      <h3>Contrats signés</h3>
      <ul className="contract-list">
        {active.map((c) => {
          const part = getMoldFamily(c.familyId);
          return (
            <li key={c.id} className="contract-card">
              <div className="contract-card__header">
                <strong>{c.clientName}</strong>
                <span>{formatUnitPrice(c.pricePerUnit)}/pièce</span>
              </div>
              <div className="contract-card__body">
                <span>{part.partName}</span>
                <span>{c.producedGood.toLocaleString('fr-FR')} vendues ({c.producedReject.toLocaleString('fr-FR')} rebuts)</span>
                <span>{formatCurrency(c.producedGood * c.pricePerUnit)} générés</span>
              </div>
              <button onClick={() => cancelContract(factory.id, c.id)}>Annuler</button>
            </li>
          );
        })}
        {factory.activeContracts.length === 0 && <li className="empty">Aucun contrat signé — signez une offre.</li>}
      </ul>
    </div>
  );
}
