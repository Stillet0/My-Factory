import { describe, it, expect } from 'vitest';
import { createFactory } from '../entities/factory';
import { createMold } from '../entities/mold';
import { dailyLogisticsUpdate } from './logisticsSystem';

describe('dailyLogisticsUpdate', () => {
  it('leaves a material shipment queued when arrivalDay is in the future', () => {
    const factory = createFactory('f1', 'Test');
    factory.incomingMaterialShipments.push({ id: 's1', materialId: 'pp', kg: 200, arrivalDay: 5 });
    dailyLogisticsUpdate(factory, 2, 0);
    expect(factory.incomingMaterialShipments).toHaveLength(1);
    expect(factory.materialStockKg['pp'] ?? 0).toBe(0);
  });

  it('adds stock and clears the entry once a material shipment arrives', () => {
    const factory = createFactory('f1', 'Test');
    factory.materialStockKg['pp'] = 50;
    factory.incomingMaterialShipments.push({ id: 's1', materialId: 'pp', kg: 200, arrivalDay: 3 });
    dailyLogisticsUpdate(factory, 3, 0);
    expect(factory.incomingMaterialShipments).toHaveLength(0);
    expect(factory.materialStockKg['pp']).toBe(250);
    expect(factory.events[0].message).toContain('Livraison reçue');
  });

  it('leaves a mold transfer queued when arrivalDay is in the future', () => {
    const factory = createFactory('f1', 'Test');
    const mold = createMold('mold_cap', 'm1');
    mold.wear = 0.4;
    factory.incomingMoldTransfers.push({ id: 't1', mold, arrivalDay: 5 });
    dailyLogisticsUpdate(factory, 2, 0);
    expect(factory.incomingMoldTransfers).toHaveLength(1);
    expect(factory.molds).toHaveLength(0);
  });

  it('materializes the mold (preserving wear/cycles) once a mold transfer arrives', () => {
    const factory = createFactory('f1', 'Test');
    const mold = createMold('mold_cap', 'm1');
    mold.wear = 0.4;
    mold.cyclesRun = 120;
    factory.incomingMoldTransfers.push({ id: 't1', mold, arrivalDay: 2 });
    dailyLogisticsUpdate(factory, 2, 0);
    expect(factory.incomingMoldTransfers).toHaveLength(0);
    expect(factory.molds).toHaveLength(1);
    expect(factory.molds[0]).toMatchObject({ id: 'm1', wear: 0.4, cyclesRun: 120 });
    expect(factory.events[0].message).toContain('Moule reçu');
  });
});
