/**
 * GATE rank estimation.
 *
 * The exact GATE score→rank mapping is published only after results. Between
 * exam and results, rank is estimated from marks using the branch's historical
 * qualifying statistics (total appeared, total qualified, qualifying cutoff).
 * This models the mark distribution as roughly exponential above the cutoff —
 * a common, transparent approximation — and is clearly labelled an estimate.
 */

export interface BranchStats {
  totalApplicants: number;
  totalQualified: number;
  generalCutoff: number;
  maxMarks: number;
  /**
   * The candidate's own category cutoff (OBC-NCL/EWS or SC/ST/PwD). GATE
   * ranks are all-India and shared across categories, so this only changes
   * whether the candidate qualifies. Defaults to the general cutoff.
   */
  qualifyingCutoff?: number;
}

export interface RankEstimate {
  estimatedRank: number;
  rankLow: number;
  rankHigh: number;
  percentile: number;
  qualifies: boolean;
}

export function estimateRank(marks: number, stats: BranchStats): RankEstimate {
  const { totalApplicants, totalQualified, generalCutoff, maxMarks } = stats;
  const m = Math.max(0, Math.min(marks, maxMarks));

  const qualifies = m >= (stats.qualifyingCutoff ?? generalCutoff);

  // Above the cutoff, model the count of candidates scoring >= m as decaying
  // exponentially from totalQualified (at the cutoff) toward ~1 (at maxMarks).
  // rank(cutoff) ≈ totalQualified; rank(maxMarks) ≈ 1.
  const span = Math.max(1, maxMarks - generalCutoff);
  let estimatedRank: number;

  if (m >= generalCutoff) {
    const frac = (m - generalCutoff) / span; // 0 at cutoff, 1 at max
    const k = Math.log(Math.max(2, totalQualified)); // decay constant
    estimatedRank = Math.max(1, Math.round(totalQualified * Math.exp(-k * frac)));
  } else {
    // Below the cutoff, interpolate linearly between totalQualified (at cutoff)
    // and totalApplicants (at 0).
    const frac = generalCutoff > 0 ? (generalCutoff - m) / generalCutoff : 0;
    estimatedRank = Math.round(totalQualified + frac * (totalApplicants - totalQualified));
  }

  const percentile = Math.max(
    0,
    Math.min(100, (1 - estimatedRank / Math.max(1, totalApplicants)) * 100),
  );

  // Report a band (±20%) to reflect that this is an estimate.
  const rankLow = Math.max(1, Math.round(estimatedRank * 0.8));
  const rankHigh = Math.round(estimatedRank * 1.2);

  return {
    estimatedRank,
    rankLow,
    rankHigh,
    percentile: Math.round(percentile * 10) / 10,
    qualifies,
  };
}
