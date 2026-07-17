import type { Factory } from '../entities/factory';
import { pushEvent } from '../entities/factory';
import { getMaterial } from '../../data/materials';

/** Resolves inter-factory shipments once per in-game day: any material or
 * mold transfer whose arrivalDay has passed lands on this factory's floor. */
export function dailyLogisticsUpdate(factory: Factory, day: number, simTimeMs: number): void {
  const stillIncomingMaterial: typeof factory.incomingMaterialShipments = [];
  for (const shipment of factory.incomingMaterialShipments) {
    if (day >= shipment.arrivalDay) {
      factory.materialStockKg[shipment.materialId] = (factory.materialStockKg[shipment.materialId] ?? 0) + shipment.kg;
      pushEvent(factory, simTimeMs, 'info', `Livraison reçue : ${shipment.kg} kg de ${getMaterial(shipment.materialId).name}.`);
    } else {
      stillIncomingMaterial.push(shipment);
    }
  }
  factory.incomingMaterialShipments = stillIncomingMaterial;

  const stillIncomingMolds: typeof factory.incomingMoldTransfers = [];
  for (const transfer of factory.incomingMoldTransfers) {
    if (day >= transfer.arrivalDay) {
      factory.molds.push(transfer.mold);
      pushEvent(factory, simTimeMs, 'info', `Moule reçu (usure ${Math.round(transfer.mold.wear * 100)}%).`);
    } else {
      stillIncomingMolds.push(transfer);
    }
  }
  factory.incomingMoldTransfers = stillIncomingMolds;
}
