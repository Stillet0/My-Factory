export type EmployeeRole = 'operator' | 'setter' | 'forklift';
export type Shift = 'morning' | 'evening' | 'night';

/** Autonomous job a setter/forklift is currently walking to a press to
 * perform — repair a breakdown, correct drifted process params, or ship out
 * boxed output. Operators don't use this; they stay parked at their press. */
export type EmployeeTask = 'repair' | 'tune' | 'deliver' | null;

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  shift: Shift;
  /** 0..1, raises output quality/speed and reduces defect rate. */
  skill: number;
  /** 0..1, rises while working, saps skill effectiveness and raises breakdown/defect risk. */
  fatigue: number;
  /** 0..1, affected by fatigue, wage fairness and overwork; low morale risks quitting. */
  morale: number;
  wagePerDay: number;
  /** The press a setter/forklift is currently walking to / working on for `task`. */
  assignedPressId: string | null;
  task: EmployeeTask;
  /** simTimeMs when the current task finishes; 0 while idle. */
  taskEndMs: number;
  hiredOnDay: number;
}

export const SHIFT_HOURS: Record<Shift, [number, number]> = {
  morning: [6, 14],
  evening: [14, 22],
  night: [22, 6],
};

let employeeSeq = 0;
export function createEmployee(role: EmployeeRole, shift: Shift, day: number, name: string): Employee {
  employeeSeq++;
  return {
    id: `emp_${employeeSeq}`,
    name,
    role,
    shift,
    skill: 0.35 + Math.random() * 0.25,
    fatigue: 0,
    morale: 0.7,
    wagePerDay: role === 'setter' ? 140 : role === 'forklift' ? 110 : 95,
    assignedPressId: null,
    task: null,
    taskEndMs: 0,
    hiredOnDay: day,
  };
}

export function isOnShiftNow(shift: Shift, hourOfDay: number): boolean {
  const [start, end] = SHIFT_HOURS[shift];
  if (start < end) return hourOfDay >= start && hourOfDay < end;
  return hourOfDay >= start || hourOfDay < end;
}
