import { useGameStore } from '../store/gameStore';
import { getPressTemplate } from '../data/presses';
import { formatCurrency, formatPercent, PRESS_STATE_LABELS } from './format';

export function Dashboard() {
  useGameStore((s) => s.tickCount);
  const { company, selectedFactoryId } = useGameStore.getState();
  const factory = company.factories.find((f) => f.id === selectedFactoryId);
  if (!factory) return null;

  return (
    <div className="panel">
      <h2>Vue d'ensemble</h2>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Trésorerie</span>
          <span className="stat-value">{formatCurrency(company.cash)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Réputation</span>
          <span className="stat-value">{formatPercent(company.reputation)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Contrats actifs</span>
          <span className="stat-value">{factory.activeContracts.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Employés</span>
          <span className="stat-value">{factory.employees.length}</span>
        </div>
      </div>

      {company.factories.length > 1 && (
        <>
          <h3>Toutes les usines</h3>
          <ul className="press-status-list">
            {company.factories.map((f) => (
              <li key={f.id} className={`press-status${f.id === selectedFactoryId ? ' press-status--ejecting' : ''}`}>
                <span className="press-status__name">{f.name}</span>
                <span>{f.presses.length} presse(s)</span>
                <span>{f.employees.length} employé(s)</span>
                <span>{f.activeContracts.length} contrat(s) actif(s)</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Presses</h3>
      <ul className="press-status-list">
        {factory.presses.map((press) => {
          const total = press.totalGood + press.totalDefects;
          const quality = total > 0 ? press.totalGood / total : 1;
          return (
            <li key={press.id} className={`press-status press-status--${press.state}`}>
              <span className="press-status__name">{getPressTemplate(press.templateId).name}</span>
              <span className="press-status__state">{PRESS_STATE_LABELS[press.state]}</span>
              <span className="press-status__wear">Usure {formatPercent(press.wear)}</span>
              <span className="press-status__quality">Qualité {formatPercent(quality)}</span>
            </li>
          );
        })}
      </ul>

      <h3>Événements récents</h3>
      <ul className="event-list">
        {factory.events.slice(0, 12).map((ev) => (
          <li key={ev.id} className={`event event--${ev.kind}`}>{ev.message}</li>
        ))}
        {factory.events.length === 0 && <li className="event">Aucun événement pour le moment.</li>}
      </ul>
    </div>
  );
}
