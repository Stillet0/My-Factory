import type { Company } from '../entities/company';
import type { Factory } from '../entities/factory';
import { nextContractId, type Contract } from '../entities/contract';
import { CLIENT_ARCHETYPES } from '../../data/clients';
import { getMoldFamily } from '../../data/moldFamilies';
import { COMPETITORS } from '../../data/competitors';
import { MATERIALS } from '../../data/materials';

/** Base odds an eligible client shows up in a given day's offer batch —
 * high enough that the player sees a near-complete daily menu to shop for
 * the best price, reduced per-family by how much competitor pressure that
 * family is under. */
const BASE_OFFER_CHANCE = 0.6;

export function dailyMarketUpdate(company: Company, factory: Factory, simTimeMs: number): void {
  for (const material of MATERIALS) {
    const current = company.materialPriceMultipliers[material.id] ?? 1;
    const drift = (Math.random() - 0.5) * 0.08;
    company.materialPriceMultipliers[material.id] = clamp(current + drift, 0.7, 1.6);
  }

  // Yesterday's unsigned offers are gone — the whole menu is rebuilt fresh
  // every day so the player is always comparing today's best prices.
  const offers: Contract[] = [];
  for (const archetype of CLIENT_ARCHETYPES) {
    if (company.reputation < archetype.reputationGate) continue;
    const pressure = computeCompetitorPressure(archetype.familyId, company);
    if (Math.random() > BASE_OFFER_CHANCE - pressure) continue;

    const family = getMoldFamily(archetype.familyId);
    const priceMult = randRange(archetype.priceMultMin, archetype.priceMultMax);

    offers.push({
      id: nextContractId(),
      clientName: archetype.name,
      familyId: archetype.familyId,
      pricePerUnit: round2(family.sellPricePerUnitBase * priceMult),
      producedGood: 0,
      producedReject: 0,
      status: 'offered',
      offeredOnMs: simTimeMs,
    });
  }
  factory.availableContracts = offers;
}

/** Rival pressure: average rival strength (boosted for a rival whose
 * specialty matches this family), scaled to a max ~0.3 swing on the base
 * offer chance, then damped by reputation — a stronger reputation wins more
 * bids off-screen, lowering the effective pressure the player feels. */
export function computeCompetitorPressure(familyId: string, company: Company): number {
  let total = 0;
  for (const rival of COMPETITORS) {
    total += rival.strength * (rival.specialtyFamilyId === familyId ? 1.5 : 1);
  }
  const raw = (total / COMPETITORS.length) * 0.3;
  return raw * (1 - company.reputation * 0.7);
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
