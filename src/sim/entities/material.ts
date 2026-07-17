/** A plastic resin and its ideal injection-molding process window. */

export interface ProcessRange {
  /** Values within [idealMin, idealMax] cause no defect. */
  idealMin: number;
  idealMax: number;
  /** Values outside [acceptMin, acceptMax] cause severe defects (near-guaranteed reject). */
  acceptMin: number;
  acceptMax: number;
}

export type MaterialFamily = 'thermoplastic' | 'thermoset';

export interface Material {
  id: string;
  name: string;
  /** Thermoplastics are remelted/cooled each cycle; thermosets are injected
   * into a hot mold and cure irreversibly — same ProcessParams shape, very
   * different numeric windows (mold hotter than melt, "cooling" = cure time). */
  family: MaterialFamily;
  /** Melt (barrel) temperature, °C. */
  meltTemp: ProcessRange;
  /** Mold surface temperature, °C. */
  moldTemp: ProcessRange;
  /** Injection pressure, bar. */
  injectionPressure: ProcessRange;
  /** Injection speed, mm/s (screw/ram velocity). */
  injectionSpeed: ProcessRange;
  /** Cooling time, seconds, before the part is rigid enough to eject (cure time for thermosets). */
  coolingTime: ProcessRange;
  /** Volumetric shrinkage, used for warping risk. */
  shrinkageRate: number;
  /** Cost per kg of virgin resin, in-game currency. */
  costPerKg: number;
  /** Density, g/cm3, used to convert part volume to shot weight. */
  density: number;
  /** If set, this material only appears for purchase/assignment once the tech is researched. */
  requiresTechId?: string;
}

/** Returns 0 if v is inside the ideal window, rising to 1 at/after the
 * acceptable-range boundary, and clamps beyond that (never > ~1.4 so a few
 * stacked deviations can still push a shot fully out of spec). */
export function deviationSeverity(v: number, r: ProcessRange): number {
  if (v >= r.idealMin && v <= r.idealMax) return 0;
  if (v < r.idealMin) {
    const span = r.idealMin - r.acceptMin;
    if (span <= 0) return v < r.acceptMin ? 1.4 : 1;
    return Math.min(1.4, (r.idealMin - v) / span);
  }
  const span = r.acceptMax - r.idealMax;
  if (span <= 0) return v > r.acceptMax ? 1.4 : 1;
  return Math.min(1.4, (v - r.idealMax) / span);
}
