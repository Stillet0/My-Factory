import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PRESSES } from '../../data/presses';
import { MOLD_TEMPLATES } from '../../data/molds';
import { MATERIALS } from '../../data/materials';
import { formatCurrency, formatDay } from '../format';

export function FinancePanel() {
  useGameStore((s) => s.tickCount);
  const { company, selectedFactoryId, buyPress, buyMold, buyMaterial, takeLoan } = useGameStore.getState();
  const factory = company.factories.find((f) => f.id === selectedFactoryId);
  const [loanAmount, setLoanAmount] = useState(10000);
  const [materialQty, setMaterialQty] = useState<Record<string, number>>({});

  if (!factory) return null;
  const recentHistory = company.history.slice(-8).reverse();

  return (
    <div className="panel">
      <h2>Finances</h2>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Trésorerie</span>
          <span className="stat-value">{formatCurrency(company.cash)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Emprunts en cours</span>
          <span className="stat-value">{formatCurrency(company.loans.reduce((s, l) => s + l.remaining, 0))}</span>
        </div>
      </div>

      <h3>Historique (compte de résultat)</h3>
      <table className="history-table">
        <thead>
          <tr><th>Jour</th><th>Revenus</th><th>Dépenses</th><th>Caisse</th></tr>
        </thead>
        <tbody>
          {recentHistory.map((h) => (
            <tr key={h.day}>
              <td>{formatDay(h.day)}</td>
              <td className="positive">+{formatCurrency(h.revenue)}</td>
              <td className="negative">-{formatCurrency(h.expenses)}</td>
              <td>{formatCurrency(h.cashAtEnd)}</td>
            </tr>
          ))}
          {recentHistory.length === 0 && <tr><td colSpan={4} className="empty">Pas encore de clôture journalière.</td></tr>}
        </tbody>
      </table>

      <h3>Acheter une presse</h3>
      <ul className="shop-list">
        {PRESSES.filter((p) => !p.requiresTechId || company.researchedTechIds.includes(p.requiresTechId)).map((p) => (
          <li key={p.id} className="shop-item">
            <span>{p.name} ({p.tonnage} T)</span>
            <button disabled={company.cash < p.costBase} onClick={() => buyPress(factory.id, p.id)}>
              {formatCurrency(p.costBase)}
            </button>
          </li>
        ))}
      </ul>

      <h3>Construire un moule</h3>
      <ul className="shop-list">
        {MOLD_TEMPLATES.map((m) => (
          <li key={m.id} className="shop-item">
            <span>{m.partName} ({m.cavities} empr.) — construction {m.buildTimeDaysBase} j</span>
            <button disabled={company.cash < m.buildCostBase} onClick={() => buyMold(factory.id, m.id)}>
              {formatCurrency(m.buildCostBase)}
            </button>
          </li>
        ))}
      </ul>

      <h3>Acheter de la matière première</h3>
      <ul className="shop-list">
        {MATERIALS.filter((mat) => !mat.requiresTechId || company.researchedTechIds.includes(mat.requiresTechId)).map((mat) => {
          const mult = company.materialPriceMultipliers[mat.id] ?? 1;
          const qty = materialQty[mat.id] ?? 100;
          const cost = qty * mat.costPerKg * mult;
          return (
            <li key={mat.id} className="shop-item shop-item--material">
              <span>{mat.name} — {(mat.costPerKg * mult).toFixed(2)} €/kg ({(factory.materialStockKg[mat.id] ?? 0).toFixed(0)} kg en stock)</span>
              <input
                type="number"
                min={10}
                step={10}
                value={qty}
                onChange={(e) => setMaterialQty({ ...materialQty, [mat.id]: Number(e.target.value) })}
              />
              <button disabled={company.cash < cost} onClick={() => buyMaterial(factory.id, mat.id, qty)}>
                Acheter ({formatCurrency(cost)})
              </button>
            </li>
          );
        })}
      </ul>

      <h3>Emprunt</h3>
      <div className="loan-form">
        <input type="number" min={1000} step={1000} value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} />
        <button onClick={() => takeLoan(loanAmount)}>Emprunter</button>
      </div>
      <ul className="loan-list">
        {company.loans.map((l) => (
          <li key={l.id}>Restant {formatCurrency(l.remaining)} — {formatCurrency(l.dailyPayment)}/j</li>
        ))}
      </ul>
    </div>
  );
}
