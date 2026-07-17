import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { EmployeeRole, Shift } from '../../sim/entities/employee';
import { formatCurrency, formatPercent, ROLE_LABELS, SHIFT_LABELS } from '../format';

const WAGE_ESTIMATE: Record<EmployeeRole, number> = { operator: 95, setter: 140, forklift: 110 };

export function HRPanel() {
  useGameStore((s) => s.tickCount);
  const { company, selectedFactoryId, hireEmployee } = useGameStore.getState();
  const factory = company.factories.find((f) => f.id === selectedFactoryId);
  const [role, setRole] = useState<EmployeeRole>('operator');
  const [shift, setShift] = useState<Shift>('morning');

  if (!factory) return null;

  return (
    <div className="panel">
      <h2>Ressources humaines</h2>

      <div className="hire-form">
        <label>
          Poste
          <select value={role} onChange={(e) => setRole(e.target.value as EmployeeRole)}>
            {(Object.keys(ROLE_LABELS) as EmployeeRole[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </label>
        <label>
          Équipe
          <select value={shift} onChange={(e) => setShift(e.target.value as Shift)}>
            {(Object.keys(SHIFT_LABELS) as Shift[]).map((s) => (
              <option key={s} value={s}>{SHIFT_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <button onClick={() => hireEmployee(factory.id, role, shift)}>
          Embaucher (~{formatCurrency(WAGE_ESTIMATE[role])}/j)
        </button>
      </div>

      <ul className="employee-list">
        {factory.employees.map((emp) => (
          <li key={emp.id} className="employee-card">
            <div className="employee-card__header">
              <strong>{emp.name}</strong>
              <span>{ROLE_LABELS[emp.role]} · {SHIFT_LABELS[emp.shift]}</span>
            </div>
            <div className="employee-card__stats">
              <span>Compétence {formatPercent(emp.skill)}</span>
              <span>Fatigue {formatPercent(emp.fatigue)}</span>
              <span>Moral {formatPercent(emp.morale)}</span>
              <span>{formatCurrency(emp.wagePerDay)}/j</span>
            </div>
          </li>
        ))}
        {factory.employees.length === 0 && <li className="empty">Aucun employé — recrutez votre première équipe.</li>}
      </ul>
    </div>
  );
}
