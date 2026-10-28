import type { ProblemType } from "./types";

export interface CostBand {
  min: number | null;
  max: number | null;
  label: string;
}

/**
 * Indicative INR bands for the demo ONLY.
 * Always displayed as an estimate. Never presented as a quote,
 * and never attached to structural or electrical safety decisions.
 */
export function costBandFor(problemType: ProblemType): CostBand {
  switch (problemType) {
    case "active_leak":
      return { min: 1500, max: 4000, label: "Indicative estimate: Rs 1,500 - Rs 4,000" };
    case "dampness":
      return { min: 2000, max: 6000, label: "Indicative estimate: Rs 2,000 - Rs 6,000" };
    case "mould":
      return { min: 1500, max: 5000, label: "Indicative estimate: Rs 1,500 - Rs 5,000" };
    case "crack":
      return { min: 1000, max: 3000, label: "Indicative estimate: Rs 1,000 - Rs 3,000" };
    case "peeling_paint":
      return { min: 2500, max: 7000, label: "Indicative estimate: Rs 2,500 - Rs 7,000" };
    case "water_stain":
      return { min: 1500, max: 4000, label: "Indicative estimate: Rs 1,500 - Rs 4,000" };
    case "electrical_fault":
      return { min: null, max: null, label: "Quote after inspection by a licensed electrician" };
    case "none_detected":
      return { min: null, max: null, label: "No repair cost - no defect detected" };
    default:
      return { min: 500, max: 1500, label: "Indicative estimate: Rs 500 - Rs 1,500" };
  }
}
