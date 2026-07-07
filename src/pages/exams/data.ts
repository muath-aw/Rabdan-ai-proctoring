import type { ExamSummary, Incident } from './types';

export const EXAM_META = {
  title: 'Calculus II · Final',
  room: 'Hall B',
  window: '09:00 – 12:00',
  activeSession: 'In session 0:42',
  endedSession: 'Ended 12:04 · Jun 29',
  students: 38,
};

export const seedIncidents = (): Incident[] => [
  { id: 'INC-04817', type: 'phone', time: '09:42:18', cam: 'cam-04', subjects: ['Maya Olsen'], conf: 0.94, status: 'open' },
  { id: 'INC-04815', type: 'adjacent', time: '09:41:02', cam: 'cam-02', subjects: [null, null], conf: 0.81, status: 'open' },
  { id: 'INC-04812', type: 'phone', time: '09:39:47', cam: 'cam-04', subjects: ['Daniel Reyes'], conf: 0.88, status: 'open' },
  { id: 'INC-04808', type: 'adjacent', time: '09:37:30', cam: 'cam-06', subjects: ['Priya Anand', 'Marcus Webb'], conf: null, status: 'confirmed' },
  { id: 'INC-04802', type: 'phone', time: '09:35:11', cam: 'cam-01', subjects: [null], conf: 0.69, status: 'open' },
  { id: 'INC-04798', type: 'phone', time: '09:33:50', cam: 'cam-03', subjects: ['Liang Wu'], conf: 0.91, status: 'confirmed' },
  { id: 'INC-04791', type: 'adjacent', time: '09:30:22', cam: 'cam-02', subjects: ['Hana Sato', null], conf: null, status: 'discarded' },
  { id: 'INC-04785', type: 'phone', time: '09:28:05', cam: 'cam-05', subjects: ['Sara Kim'], conf: 0.85, status: 'discarded' },
  { id: 'INC-04779', type: 'adjacent', time: '09:25:40', cam: 'cam-06', subjects: ['Noah Pratt', 'Ava Lindqvist'], conf: 0.79, status: 'open' },
  { id: 'INC-04772', type: 'phone', time: '09:22:14', cam: 'cam-01', subjects: ['Owen Diaz'], conf: 0.63, status: 'open' },
  { id: 'INC-04766', type: 'adjacent', time: '09:19:03', cam: 'cam-03', subjects: ['Ivy Barnes', 'Leo Farrow'], conf: 0.86, status: 'confirmed' },
];

export const ACTIVE_EXAMS: ExamSummary[] = [
  { id: 'calc2-final', letter: 'C', title: 'Calculus II · Final', room: 'Hall B', when: '09:00 – 12:00', live: true, total: 7, open: 5, ts: 900 },
  { id: 'ochem-midterm', letter: 'O', title: 'Organic Chemistry · Midterm', room: 'Lab 2', when: '09:30 – 11:30', live: true, total: 2, open: 0, ts: 930 },
];

export const PAST_EXAMS: ExamSummary[] = [
  { id: 'linalg-final', letter: 'L', title: 'Linear Algebra · Final', room: 'Hall A', when: 'Jun 28, 2026', total: 3, open: 1, ts: 20260628 },
  { id: 'history-midterm', letter: 'W', title: 'World History · Midterm', room: 'Room 110', when: 'Jun 27, 2026', total: 0, open: 0, ts: 20260627 },
  { id: 'microecon-final', letter: 'M', title: 'Microeconomics · Final', room: 'Hall B', when: 'Jun 26, 2026', total: 5, open: 0, ts: 20260626 },
];

export const formatConfidence = (conf: number | null) => (conf == null ? '—' : `${Math.round(conf * 100)}%`);

export const LOW_CONFIDENCE_THRESHOLD = 0.7;
