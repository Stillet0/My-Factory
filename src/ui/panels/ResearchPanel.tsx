import { useGameStore } from '../../store/gameStore';
import { TECH_TREE, getTechNode, type TechCategory } from '../../data/techtree';
import { formatCurrency, TECH_CATEGORY_LABELS } from '../format';

const CATEGORIES: TechCategory[] = ['presses', 'automation', 'materials', 'quality'];

export function ResearchPanel() {
  useGameStore((s) => s.tickCount);
  const { company, startResearch } = useGameStore.getState();

  const inProgress = company.researchInProgress;
  const inProgressNode = inProgress ? getTechNode(inProgress.techId) : null;

  return (
    <div className="panel">
      <h2>R&amp;D</h2>

      {inProgress && inProgressNode && (
        <div className="alert alert--info">
          <span>{inProgressNode.name} — {inProgress.daysRemaining} j restants</span>
          <div className="progress-bar">
            <div
              className="progress-bar__fill"
              style={{ width: `${Math.min(100, Math.max(0, (1 - inProgress.daysRemaining / inProgressNode.researchDays) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {CATEGORIES.map((category) => (
        <div key={category}>
          <h3>{TECH_CATEGORY_LABELS[category]}</h3>
          {TECH_TREE.filter((n) => n.category === category).map((node) => {
            const researched = company.researchedTechIds.includes(node.id);
            const missingPrereqs = node.prerequisiteIds.filter((id) => !company.researchedTechIds.includes(id));
            const locked = !researched && missingPrereqs.length > 0;
            const disabled = researched || locked || !!inProgress || company.cash < node.cost;

            return (
              <div key={node.id} className={`tech-node${researched ? ' tech-node--researched' : ''}${locked ? ' tech-node--locked' : ''}`}>
                <div className="tech-node__header">
                  <span>{node.name}</span>
                  <span>{formatCurrency(node.cost)}</span>
                </div>
                <p>{node.description}</p>
                <div className="tech-node__meta">
                  <span>{node.researchDays} j</span>
                  {missingPrereqs.length > 0 && (
                    <span>Prérequis : {missingPrereqs.map((id) => getTechNode(id).name).join(', ')}</span>
                  )}
                </div>
                {researched ? (
                  <span className="param-slider__value--ok">Recherché</span>
                ) : (
                  <button disabled={disabled} onClick={() => startResearch(node.id)}>Lancer</button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
