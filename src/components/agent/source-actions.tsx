import { createContext, useContext } from "react";

export interface SourceHighlight {
  /** Citation number in the answer. */
  n: number;
  passageId: string;
  /** Exact sentence to highlight inside the passage. */
  quote: string;
  score: number;
}

export interface SourceView {
  id: string;
  /** Highlights a whole passage, e.g. a candidate opened from the evidence list. */
  passageId?: string;
  /** Sentence-level highlights for every citation of this document in one answer. */
  highlights?: SourceHighlight[];
  /** Citation number to focus first. */
  active?: number;
}

export const SourceActions = createContext<(view: SourceView) => void>(
  () => {},
);

export const useOpenSource = () => useContext(SourceActions);
