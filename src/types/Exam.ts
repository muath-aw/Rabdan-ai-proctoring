export type ViolationType = 'phone' | 'adjacent';

export type IncidentStatus = 'open' | 'confirmed' | 'discarded';

/**
 * Subjects: 1 entry for phone incidents, 2 for adjacent-students incidents.
 * `null` means the subject could not be identified.
 */
export type Incident = {
  id: string;
  type: ViolationType;
  time: string;
  cam: string;
  subjects: (string | null)[];
  conf: number | null;
  status: IncidentStatus;
};

export type WorkspaceMode = 'active' | 'past';

export type ExamSummary = {
  id: string;
  letter: string;
  title: string;
  room: string;
  when: string;
  live?: boolean;
  total: number;
  open: number;
  /** Sort key: start time (active) or date (past). */
  ts: number;
};
