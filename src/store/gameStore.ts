import { create } from 'zustand';
import { createClock, advanceClock, setSpeed as setClockSpeed, DAY_LENGTH_MS, type SimClockState, type SimSpeed } from '../sim/clock';
import { createCompany, type Company } from '../sim/entities/company';
import { createFactory, pushEvent, type Factory } from '../sim/entities/factory';
import { createPress, type ProcessParams } from '../sim/entities/press';
import { createMold } from '../sim/entities/mold';
import { createEmployee, type EmployeeRole, type Shift } from '../sim/entities/employee';
import { tickProduction } from '../sim/systems/productionSystem';
import { tickLabor } from '../sim/systems/laborSystem';
import { tickFatigue, tickOperatorStaffing, dailyHrUpdate } from '../sim/systems/hrSystem';
import { dailyMarketUpdate } from '../sim/systems/marketSystem';
import {
  cancelContract as cancelContractFinance,
  dailyFinanceUpdate,
  purchasePress,
  buildMold as buildMoldFinance,
  buyMaterial as buyMaterialFinance,
  takeLoan as takeLoanFinance,
  designMold as designMoldFinance,
  startResearch as startResearchFinance,
  AUTOMATION_UPGRADE_COST,
  foundFactory as foundFactoryFinance,
  chargeMaterialTransfer,
  chargeMoldTransfer,
  TRANSIT_DAYS,
} from '../sim/systems/financeSystem';
import { repairCost, preventiveCost, performRepair, performPreventiveMaintenance } from '../sim/systems/maintenanceSystem';
import { dailyMoldUpdate } from '../sim/systems/moldSystem';
import { dailyResearchUpdate } from '../sim/systems/researchSystem';
import { dailyLogisticsUpdate } from '../sim/systems/logisticsSystem';
import { getMaterial, MATERIALS } from '../data/materials';
import { getMoldTemplate } from '../data/molds';
import { getMoldFamily, type MoldDesignSpec } from '../data/moldFamilies';
import { getPressTemplate } from '../data/presses';
import { saveGame, loadGame, hasSave } from '../save/saveManager';

let pressSeq = 0;
let moldSeq = 0;
let moldQueueSeq = 0;
let factorySeq = 1;
let shipmentSeq = 0;
let transferSeq = 0;
function nextPressId(): string { pressSeq++; return `press_${pressSeq}`; }
function nextMoldId(): string { moldSeq++; return `moldinst_${moldSeq}`; }
function nextMoldQueueId(): string { moldQueueSeq++; return `moldq_${moldQueueSeq}`; }
function nextFactoryId(): string { factorySeq++; return `factory_${factorySeq}`; }
function nextShipmentId(): string { shipmentSeq++; return `ship_${shipmentSeq}`; }
function nextTransferId(): string { transferSeq++; return `transfer_${transferSeq}`; }

const LEGACY_MOLD_TO_FAMILY: Record<string, string> = {
  mold_cap: 'cap',
  mold_lid: 'lid',
  mold_housing: 'housing',
  mold_toy: 'toy',
};

const STARTER_EMPLOYEE_NAMES: [string, string] = ['Marc Dubois', 'Sophie Laurent'];

export type UiTab = 'dashboard' | 'contracts' | 'machines' | 'hr' | 'finance' | 'design' | 'research' | 'logistics';

/** Seeds a brand-new factory with the same minimal starter kit as the
 * company's very first plant, so it's immediately usable rather than an
 * empty shell requiring several purchases before anything can run. */
function seedStarterFactory(factory: Factory, day: number, employeeNames: [string, string] = STARTER_EMPLOYEE_NAMES): void {
  const press = createPress(nextPressId(), 'press_60t');
  const mold = createMold('mold_cap', nextMoldId());
  factory.presses.push(press);
  factory.molds.push(mold);
  factory.employees.push(createEmployee('operator', 'morning', day, employeeNames[0]));
  factory.employees.push(createEmployee('setter', 'morning', day, employeeNames[1]));
  factory.materialStockKg['pp'] = 400;
}

function buildInitialFactory(): Factory {
  const factory = createFactory('factory_1', 'Usine n°1');
  seedStarterFactory(factory, 0);
  return factory;
}

function buildInitialCompany(): Company {
  const company = createCompany();
  const factory = buildInitialFactory();
  company.factories.push(factory);
  for (const m of MATERIALS) company.materialPriceMultipliers[m.id] = 1;
  dailyMarketUpdate(company, factory, 0);
  dailyMarketUpdate(company, factory, 0);
  pushEvent(factory, 0, 'info', 'Bienvenue ! Assemblez une presse, une matière, un moule et un opérateur pour démarrer la production.');
  return company;
}

interface GameStore {
  clock: SimClockState;
  company: Company;
  tickCount: number;
  selectedFactoryId: string;
  hasExistingSave: boolean;
  /** Which sidebar panel is showing — settable from the UI or by clicking the office in the factory scene. */
  uiTab: UiTab;

  update: (realDeltaMs: number) => void;
  setSpeed: (speed: SimSpeed) => void;
  setUiTab: (tab: UiTab) => void;

  acceptContract: (factoryId: string, contractId: string) => void;
  cancelContract: (factoryId: string, contractId: string) => void;
  assignPress: (factoryId: string, pressId: string, patch: { moldId?: string | null; materialId?: string | null; operatorId?: string | null; contractId?: string | null }) => void;
  setPressParams: (factoryId: string, pressId: string, params: Partial<ProcessParams>) => void;
  repairPress: (factoryId: string, pressId: string) => void;
  maintainPress: (factoryId: string, pressId: string) => void;

  hireEmployee: (factoryId: string, role: EmployeeRole, shift: Shift) => void;

  buyPress: (factoryId: string, templateId: string) => void;
  buyMold: (factoryId: string, templateId: string) => void;
  designMold: (factoryId: string, spec: MoldDesignSpec) => void;
  buyMaterial: (factoryId: string, materialId: string, kg: number) => void;
  takeLoan: (amount: number) => void;

  startResearch: (techId: string) => void;
  automatePress: (factoryId: string, pressId: string) => void;

  foundFactory: (name: string) => void;
  selectFactory: (factoryId: string) => void;
  transferMaterial: (fromFactoryId: string, toFactoryId: string, materialId: string, kg: number) => void;
  transferMold: (fromFactoryId: string, toFactoryId: string, moldId: string) => void;

  saveGame: () => void;
  loadGame: () => void;
  resetGame: () => void;
}

function findFactory(company: Company, factoryId: string): Factory {
  const f = company.factories.find((x) => x.id === factoryId);
  if (!f) throw new Error(`Unknown factory ${factoryId}`);
  return f;
}

let lastProcessedDay = 0;
let lastUiUpdateAt = 0;
const UI_UPDATE_INTERVAL_MS = 180;

export const useGameStore = create<GameStore>((set, get) => ({
  clock: createClock(),
  company: buildInitialCompany(),
  tickCount: 0,
  selectedFactoryId: 'factory_1',
  hasExistingSave: hasSave(),
  uiTab: 'dashboard',

  update: (realDeltaMs: number) => {
    const { clock, company } = get();
    let dirty = false;
    advanceClock(clock, realDeltaMs, (tickMs) => {
      dirty = true;
      const hourOfDay = (clock.simTimeMs % DAY_LENGTH_MS) / DAY_LENGTH_MS * 24;
      for (const factory of company.factories) {
        tickOperatorStaffing(factory, hourOfDay);
        tickProduction(company, factory, tickMs, clock.simTimeMs, hourOfDay);
        tickFatigue(factory, tickMs, hourOfDay);
        tickLabor(company, factory, clock.simTimeMs, hourOfDay);
      }
      if (clock.day > lastProcessedDay) {
        lastProcessedDay = clock.day;
        const primaryFactory = company.factories[0];
        if (primaryFactory) dailyResearchUpdate(company, primaryFactory, clock.simTimeMs);
        for (const factory of company.factories) {
          dailyHrUpdate(factory, clock.simTimeMs);
          dailyMarketUpdate(company, factory, clock.simTimeMs);
          dailyMoldUpdate(company, factory, clock.day, clock.simTimeMs, nextMoldId);
          dailyLogisticsUpdate(factory, clock.day, clock.simTimeMs);
          dailyFinanceUpdate(company, factory, clock.day);
        }
      }
    });
    if (dirty) {
      const now = performance.now();
      if (now - lastUiUpdateAt >= UI_UPDATE_INTERVAL_MS) {
        lastUiUpdateAt = now;
        set({ tickCount: get().tickCount + 1 });
      }
    }
  },

  setSpeed: (speed) => {
    setClockSpeed(get().clock, speed);
    set({ tickCount: get().tickCount + 1 });
  },

  setUiTab: (tab) => set({ uiTab: tab }),

  acceptContract: (factoryId, contractId) => {
    const { company } = get();
    const factory = findFactory(company, factoryId);
    const idx = factory.availableContracts.findIndex((c) => c.id === contractId);
    if (idx === -1) return;
    const [contract] = factory.availableContracts.splice(idx, 1);
    contract.status = 'active';
    factory.activeContracts.push(contract);
    set({ tickCount: get().tickCount + 1 });
  },

  cancelContract: (factoryId, contractId) => {
    const { company } = get();
    const factory = findFactory(company, factoryId);
    const result = cancelContractFinance(factory, contractId);
    if (!result.ok) return;
    set({ tickCount: get().tickCount + 1 });
  },

  assignPress: (factoryId, pressId, patch) => {
    const { company } = get();
    const factory = findFactory(company, factoryId);
    const press = factory.presses.find((p) => p.id === pressId);
    if (!press) return;
    if (patch.moldId !== undefined) press.moldId = patch.moldId;
    if (patch.materialId !== undefined) press.materialId = patch.materialId;
    if (patch.operatorId !== undefined) {
      for (const p of factory.presses) if (p.operatorId === patch.operatorId) p.operatorId = null;
      press.operatorId = patch.operatorId;
    }
    if (patch.contractId !== undefined) press.contractId = patch.contractId;
    set({ tickCount: get().tickCount + 1 });
  },

  setPressParams: (factoryId, pressId, params) => {
    const { company } = get();
    const factory = findFactory(company, factoryId);
    const press = factory.presses.find((p) => p.id === pressId);
    if (!press) return;
    press.params = { ...press.params, ...params };
    set({ tickCount: get().tickCount + 1 });
  },

  repairPress: (factoryId, pressId) => {
    const { company } = get();
    const factory = findFactory(company, factoryId);
    const press = factory.presses.find((p) => p.id === pressId);
    if (!press || press.state !== 'fault') return;
    const cost = repairCost(press);
    if (company.cash < cost) return;
    company.cash -= cost;
    performRepair(press);
    set({ tickCount: get().tickCount + 1 });
  },

  maintainPress: (factoryId, pressId) => {
    const { company } = get();
    const factory = findFactory(company, factoryId);
    const press = factory.presses.find((p) => p.id === pressId);
    if (!press || press.state === 'fault') return;
    const cost = preventiveCost(press);
    if (company.cash < cost) return;
    company.cash -= cost;
    performPreventiveMaintenance(press);
    set({ tickCount: get().tickCount + 1 });
  },

  hireEmployee: (factoryId, role, shift) => {
    const { company, clock } = get();
    const factory = findFactory(company, factoryId);
    const names = ['Julien Petit', 'Camille Martin', 'Nadia Benali', 'Thomas Moreau', 'Léa Girard', 'Karim Haddad', 'Chloé Fontaine'];
    const name = names[Math.floor(Math.random() * names.length)];
    const emp = createEmployee(role, shift, clock.day, name);
    factory.employees.push(emp);
    pushEvent(factory, clock.simTimeMs, 'hired', `${emp.name} rejoint l'équipe (${role}, ${shift}).`);
    set({ tickCount: get().tickCount + 1 });
  },

  buyPress: (factoryId, templateId) => {
    const { company } = get();
    const factory = findFactory(company, factoryId);
    const result = purchasePress(company, templateId);
    if (!result.ok) return;
    factory.presses.push(createPress(nextPressId(), templateId));
    set({ tickCount: get().tickCount + 1 });
  },

  buyMold: (factoryId, templateId) => {
    const { company, clock } = get();
    const factory = findFactory(company, factoryId);
    const template = getMoldTemplate(templateId);
    const result = buildMoldFinance(company, templateId);
    if (!result.ok) return;
    factory.moldsInProgress.push({ id: nextMoldQueueId(), templateId, readyOnDay: clock.day + template.buildTimeDaysBase });
    pushEvent(factory, clock.simTimeMs, 'info', `Fabrication du moule ${template.partName} lancée (${template.buildTimeDaysBase} j).`);
    set({ tickCount: get().tickCount + 1 });
  },

  designMold: (factoryId, spec) => {
    const { company, clock } = get();
    const factory = findFactory(company, factoryId);
    const family = getMoldFamily(spec.familyId);
    const result = designMoldFinance(company, family, spec.cavities, spec.tier, spec.materialIds);
    if (!result.ok || !result.template) return;
    factory.moldsInProgress.push({ id: nextMoldQueueId(), templateId: result.template.id, readyOnDay: clock.day + result.template.buildTimeDaysBase });
    pushEvent(factory, clock.simTimeMs, 'info', `Conception « ${result.template.partName} » lancée (${result.template.buildTimeDaysBase} j).`);
    set({ tickCount: get().tickCount + 1 });
  },

  buyMaterial: (factoryId, materialId, kg) => {
    const { company } = get();
    const factory = findFactory(company, factoryId);
    const material = getMaterial(materialId);
    buyMaterialFinance(company, factory, materialId, kg, material.costPerKg);
    set({ tickCount: get().tickCount + 1 });
  },

  takeLoan: (amount) => {
    const { company } = get();
    takeLoanFinance(company, amount);
    set({ tickCount: get().tickCount + 1 });
  },

  startResearch: (techId) => {
    const { company } = get();
    const result = startResearchFinance(company, techId);
    if (!result.ok) return;
    set({ tickCount: get().tickCount + 1 });
  },

  automatePress: (factoryId, pressId) => {
    const { company, clock } = get();
    const factory = findFactory(company, factoryId);
    const press = factory.presses.find((p) => p.id === pressId);
    if (!press || press.automated) return;
    if (!company.researchedTechIds.includes('automation_1')) return;
    if (company.cash < AUTOMATION_UPGRADE_COST) return;
    company.cash -= AUTOMATION_UPGRADE_COST;
    press.automated = true;
    pushEvent(factory, clock.simTimeMs, 'info', `${getPressTemplate(press.templateId).name} automatisée.`);
    set({ tickCount: get().tickCount + 1 });
  },

  foundFactory: (name) => {
    const { company, clock } = get();
    const result = foundFactoryFinance(company);
    if (!result.ok) return;
    const factory = createFactory(nextFactoryId(), name);
    seedStarterFactory(factory, clock.day);
    company.factories.push(factory);
    pushEvent(factory, clock.simTimeMs, 'info', `${factory.name} fondée !`);
    set({ selectedFactoryId: factory.id, tickCount: get().tickCount + 1 });
  },

  selectFactory: (factoryId) => {
    const { company } = get();
    if (!company.factories.some((f) => f.id === factoryId)) return;
    set({ selectedFactoryId: factoryId, tickCount: get().tickCount + 1 });
  },

  transferMaterial: (fromFactoryId, toFactoryId, materialId, kg) => {
    const { company, clock } = get();
    if (fromFactoryId === toFactoryId || kg <= 0) return;
    const from = findFactory(company, fromFactoryId);
    const to = findFactory(company, toFactoryId);
    const stock = from.materialStockKg[materialId] ?? 0;
    if (stock < kg) return;
    const result = chargeMaterialTransfer(company, kg);
    if (!result.ok) return;
    from.materialStockKg[materialId] = stock - kg;
    to.incomingMaterialShipments.push({ id: nextShipmentId(), materialId, kg, arrivalDay: clock.day + TRANSIT_DAYS });
    pushEvent(from, clock.simTimeMs, 'info', `${kg} kg de ${getMaterial(materialId).name} expédiés vers ${to.name}.`);
    set({ tickCount: get().tickCount + 1 });
  },

  transferMold: (fromFactoryId, toFactoryId, moldId) => {
    const { company, clock } = get();
    if (fromFactoryId === toFactoryId) return;
    const from = findFactory(company, fromFactoryId);
    const to = findFactory(company, toFactoryId);
    const idx = from.molds.findIndex((m) => m.id === moldId);
    if (idx === -1) return;
    if (from.presses.some((p) => p.moldId === moldId)) return;
    const result = chargeMoldTransfer(company);
    if (!result.ok) return;
    const [mold] = from.molds.splice(idx, 1);
    to.incomingMoldTransfers.push({ id: nextTransferId(), mold, arrivalDay: clock.day + TRANSIT_DAYS });
    pushEvent(from, clock.simTimeMs, 'info', `Moule expédié vers ${to.name}.`);
    set({ tickCount: get().tickCount + 1 });
  },

  saveGame: () => {
    const { clock, company } = get();
    saveGame(clock, company);
  },

  loadGame: () => {
    const data = loadGame();
    if (!data) return;
    const { company } = data;
    company.customMoldTemplates ??= [];
    company.researchedTechIds ??= [];
    company.researchInProgress ??= null;
    for (const factory of company.factories) {
      factory.moldsInProgress ??= [];
      factory.incomingMaterialShipments ??= [];
      factory.incomingMoldTransfers ??= [];
      for (const press of factory.presses) {
        press.automated ??= false;
        press.pendingGoodUnits ??= 0;
      }
      for (const emp of factory.employees) {
        emp.task ??= null;
        emp.taskEndMs ??= 0;
        emp.assignedPressId ??= null;
      }
      for (const contract of [...factory.activeContracts, ...factory.availableContracts]) {
        const legacy = contract as unknown as { familyId?: string; moldTemplateId?: string };
        if (legacy.familyId === undefined && legacy.moldTemplateId) {
          contract.familyId = LEGACY_MOLD_TO_FAMILY[legacy.moldTemplateId] ?? legacy.moldTemplateId.replace('mold_', '');
        }
      }
    }
    lastProcessedDay = data.clock.day;
    set({ clock: data.clock, company, tickCount: get().tickCount + 1, hasExistingSave: true });
  },

  resetGame: () => {
    lastProcessedDay = 0;
    set({ clock: createClock(), company: buildInitialCompany(), tickCount: get().tickCount + 1 });
  },
}));
