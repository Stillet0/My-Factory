import type { Company } from '../entities/company';
import type { Factory } from '../entities/factory';
import { nextContractId, type Contract } from '../entities/contract';
import { CLIENT_ARCHETYPES } from '../../data/clients';
import { getMoldTemplate } from '../../data/molds';
import { MATERIALS } from '../../data/materials';
import { DAY_LENGTH_MS } from '../clock';

const OFFER_SHELF_LIFE_DAYS = 6;
const MAX_AVAILABLE_OFFERS = 6;
/** Simple competitor pressure: shaves this much off each archetype's daily
 * offer chance, representing rival plants winning some bids off-screen. */
const COMPETITOR_PRESSURE = 0.12;

export function dailyMarketUpdate(company: Company, factory: Factory, simTimeMs: number): void {
  for (const material of MATERIALS) {
    const current = company.materialPriceMultipliers[material.id] ?? 1;
    const drift = (Math.random() - 0.5) * 0.08;
    company.materialPriceMultipliers[material.id] = clamp(current + drift, 0.7, 1.6);
  }

  factory.availableContracts = factory.availableContracts.filter(
    (c) => simTimeMs - c.offeredOnMs < OFFER_SHELF_LIFE_DAYS * DAY_LENGTH_MS,
  );

  if (factory.availableContracts.length >= MAX_AVAILABLE_OFFERS) return;

  for (const archetype of CLIENT_ARCHETYPES) {
    if (company.reputation < archetype.reputationGate) continue;
    if (factory.availableContracts.length >= MAX_AVAILABLE_OFFERS) break;
    const baseChance = 0.35;
    if (Math.random() > baseChance - COMPETITOR_PRESSURE) continue;

    const template = getMoldTemplate(archetype.moldTemplateId);
    const qty = Math.round(randRange(archetype.qtyMin, archetype.qtyMax));
    const priceMult = randRange(archetype.priceMultMin, archetype.priceMultMax);
    const deadlineDays = randRange(archetype.deadlineDaysMin, archetype.deadlineDaysMax);

    const contract: Contract = {
      id: nextContractId(),
      clientName: archetype.name,
      moldTemplateId: archetype.moldTemplateId,
      quantity: qty,
      producedGood: 0,
      producedReject: 0,
      pricePerUnit: round2(template.sellPricePerUnitBase * priceMult),
      deadlineMs: simTimeMs + deadlineDays * DAY_LENGTH_MS,
      minQualityRatio: archetype.minQualityRatio,
      status: 'offered',
      offeredOnMs: simTimeMs,
      penaltyPerMissingUnit: round2(template.sellPricePerUnitBase * priceMult * 0.6),
    };
    factory.availableContracts.push(contract);
  }
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
