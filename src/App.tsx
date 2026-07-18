import { PhaserGame } from './render/PhaserGame';
import { Dashboard } from './ui/Dashboard';
import { ContractsPanel } from './ui/panels/ContractsPanel';
import { MachineTuningPanel } from './ui/panels/MachineTuningPanel';
import { HRPanel } from './ui/panels/HRPanel';
import { FinancePanel } from './ui/panels/FinancePanel';
import { MoldDesignPanel } from './ui/panels/MoldDesignPanel';
import { ResearchPanel } from './ui/panels/ResearchPanel';
import { LogisticsPanel } from './ui/panels/LogisticsPanel';
import { useGameStore, type UiTab } from './store/gameStore';
import type { SimSpeed } from './sim/clock';
import { DAY_LENGTH_MS } from './sim/clock';
import { foundFactoryCost } from './sim/systems/financeSystem';
import { formatCurrency, formatDay, formatTimeOfDay } from './ui/format';

const BASE_TABS: { id: UiTab; label: string }[] = [
  { id: 'dashboard', label: 'Vue d’ensemble' },
  { id: 'contracts', label: 'Contrats' },
  { id: 'machines', label: 'Presses' },
  { id: 'hr', label: 'RH' },
  { id: 'finance', label: 'Finances' },
  { id: 'design', label: 'Bureau d’étude' },
  { id: 'research', label: 'R&D' },
];

const SPEEDS: SimSpeed[] = [0, 1, 2, 4];

function App() {
  useGameStore((s) => s.tickCount);
  const tab = useGameStore((s) => s.uiTab);
  const setTab = useGameStore((s) => s.setUiTab);
  const {
    clock, company, selectedFactoryId, setSpeed, saveGame, loadGame, resetGame, hasExistingSave, foundFactory, selectFactory,
  } = useGameStore.getState();

  const TABS = company.factories.length > 1 ? [...BASE_TABS, { id: 'logistics' as const, label: 'Logistique' }] : BASE_TABS;
  const nextFactoryCost = foundFactoryCost(company);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Plastique Tycoon</h1>
        <span className="app-header__day">
          {formatDay(clock.day)}
          <span className="app-header__time">{formatTimeOfDay(clock.simTimeMs, DAY_LENGTH_MS)}</span>
        </span>
        <div className="speed-controls">
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={clock.speed === s ? 'speed-btn speed-btn--active' : 'speed-btn'}
              onClick={() => setSpeed(s)}
            >
              {s === 0 ? '⏸' : `×${s}`}
            </button>
          ))}
        </div>
        <span className="app-header__cash">{formatCurrency(company.cash)}</span>
        <div className="save-controls">
          <button onClick={saveGame}>Sauvegarder</button>
          <button disabled={!hasExistingSave} onClick={loadGame}>Charger</button>
          <button
            onClick={() => {
              if (confirm('Recommencer une nouvelle partie ?')) resetGame();
            }}
          >
            Nouvelle partie
          </button>
        </div>
      </header>

      <div className="factory-bar">
        {company.factories.map((f) => (
          <button
            key={f.id}
            className={f.id === selectedFactoryId ? 'factory-tab factory-tab--active' : 'factory-tab'}
            onClick={() => selectFactory(f.id)}
          >
            {f.name}
          </button>
        ))}
        <button
          className="factory-tab factory-tab--new"
          disabled={company.cash < nextFactoryCost}
          onClick={() => foundFactory(`Usine n°${company.factories.length + 1}`)}
        >
          + Nouvelle usine ({formatCurrency(nextFactoryCost)})
        </button>
      </div>

      <div className="app-body">
        <div className="app-canvas">
          <PhaserGame />
        </div>
        <aside className="app-sidebar">
          <nav className="tab-nav">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={tab === t.id ? 'tab-btn tab-btn--active' : 'tab-btn'}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="tab-content">
            {tab === 'dashboard' && <Dashboard />}
            {tab === 'contracts' && <ContractsPanel />}
            {tab === 'machines' && <MachineTuningPanel />}
            {tab === 'hr' && <HRPanel />}
            {tab === 'finance' && <FinancePanel />}
            {tab === 'design' && <MoldDesignPanel />}
            {tab === 'research' && <ResearchPanel />}
            {tab === 'logistics' && <LogisticsPanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
