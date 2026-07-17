import type { Company } from '../entities/company';
import type { Factory } from '../entities/factory';
import { nextContractId, type Contract } from '../entities/contract';
import { pushEvent } from '../entities/factory';
import { CLIENT_ARCHETYPES } from '../../data/clients';
import { getMoldFamily } from '../../data/moldFamilies';
import { COMPETITORS } from '../../data/competitors';
import { MATERIALS } from '../../data/materials';
import { DAY_LENGTH_MS } from '../clock';

const OFFER_SHELF_LIFE_DAYS = 6;
const MAX_AVAILABLE_OFFERS = 6;

export function dailyMarketUpdate(company: Company, factory: Factory, simTimeMs: number): void {
  for (const material of MATERIALS) {
    const current = company.materialPriceMultipliers[material.id] ?? 1;
    const drift = (Math.random() - 0.5) * 0.08;
    company.materialPriceMultipliers[material.id] = clamp(current + drift, 0.7, 1.6);
  }

  const stillOffered: Contract[] = [];
  for (const c of factory.availableContracts) {
    const expired = simTimeMs - c.offeredOnMs >= OFFER_SHELF_LIFE_DAYS * DAY_LENGTH_MS;
    if (expired) {
      const rival = pickRival(c.familyId);
      pushEvent(factory, simTimeMs, 'contract_lost', `Le contrat ${c.clientName} a été remporté par ${rival.name}.`);
    } else {
      stillOffered.push(c);
    }
  }
  factory.availableContracts = stillOffered;

  if (factory.availableContracts.length >= MAX_AVAILABLE_OFFERS) return;

  for (const archetype of CLIENT_ARCHETYPES) {
    if (company.reputation < archetype.reputationGate) continue;
    if (factory.availableContracts.length >= MAX_AVAILABLE_OFFERS) break;
    const baseChance = 0.35;
    const pressure = computeCompetitorPressure(archetype.familyId, company);
    if (Math.random() > baseChance - pressure) continue;

    const family = getMoldFamily(archetype.familyId);
    const qty = Math.round(randRange(archetype.qtyMin, archetype.qtyMax));
    const priceMult = randRange(archetype.priceMultMin, archetype.priceMultMax);
    const deadlineDays = randRange(archetype.deadlineDaysMin, archetype.deadlineDaysMax);

    const contract: Contract = {
      id: nextContractId(),
      clientName: archetype.name,
      familyId: archetype.familyId,
      quantity: qty,
      producedGood: 0,
      producedReject: 0,
      pricePerUnit: round2(family.sellPricePerUnitBase * priceMult),
      deadlineMs: simTimeMs + deadlineDays * DAY_LENGTH_MS,
      minQualityRatio: archetype.minQualityRatio,
      status: 'offered',
      offeredOnMs: simTimeMs,
      penaltyPerMissingUnit: round2(family.sellPricePerUnitBase * priceMult * 0.6),
    };
    factory.availableContracts.push(contract);
  }
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

function pickRival(familyId: string) {
  const weights = COMPETITORS.map((r) => r.strength * (r.specialtyFamilyId === familyId ? 1.5 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < COMPETITORS.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return COMPETITORS[i];
  }
  return COMPETITORS[COMPETITORS.length - 1];
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
