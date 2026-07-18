import { describe, it, expect } from 'vitest';
import { createFactory } from '../entities/factory';
import { createPress } from '../entities/press';
import { createEmployee } from '../entities/employee';
import { tickOperatorStaffing } from './hrSystem';

const MORNING_HOUR = 10; // inside 'morning' (6-14)
const EVENING_HOUR = 18; // inside 'evening' (14-22)

function readyPress(): ReturnType<typeof createPress> {
  const press = createPress('p1', 'press_60t');
  press.moldId = 'mold-1';
  press.materialId = 'pp';
  press.contractId = 'ct-1';
  return press;
}

describe('tickOperatorStaffing', () => {
  it('self-assigns a free on-shift operator to an unmanned ready press', () => {
    const factory = createFactory('f1', 'Test');
    const press = readyPress();
    factory.presses.push(press);
    const operator = createEmployee('operator', 'morning', 0, 'Marc');
    factory.employees.push(operator);

    tickOperatorStaffing(factory, MORNING_HOUR);
    expect(press.operatorId).toBe(operator.id);
  });

  it('does not reassign a press whose current operator is still on shift', () => {
    const factory = createFactory('f1', 'Test');
    const press = readyPress();
    const operatorA = createEmployee('operator', 'morning', 0, 'A');
    const operatorB = createEmployee('operator', 'morning', 0, 'B');
    press.operatorId = operatorA.id;
    factory.presses.push(press);
    factory.employees.push(operatorA, operatorB);

    tickOperatorStaffing(factory, MORNING_HOUR);
    expect(press.operatorId).toBe(operatorA.id);
  });

  it('hands off to a different on-shift operator once the current one is off shift', () => {
    const factory = createFactory('f1', 'Test');
    const press = readyPress();
    const morningOp = createEmployee('operator', 'morning', 0, 'Marc');
    const eveningOp = createEmployee('operator', 'evening', 0, 'Sophie');
    press.operatorId = morningOp.id;
    factory.presses.push(press);
    factory.employees.push(morningOp, eveningOp);

    tickOperatorStaffing(factory, EVENING_HOUR); // morning shift is over now
    expect(press.operatorId).toBe(eveningOp.id);
  });

  it('never pulls an operator off a press they are already covering', () => {
    const factory = createFactory('f1', 'Test');
    const pressA = readyPress();
    const pressB = readyPress();
    pressB.id = 'p2';
    const operator = createEmployee('operator', 'morning', 0, 'Marc');
    pressA.operatorId = operator.id;
    factory.presses.push(pressA, pressB);
    factory.employees.push(operator);

    tickOperatorStaffing(factory, MORNING_HOUR);
    expect(pressA.operatorId).toBe(operator.id);
    expect(pressB.operatorId).toBeNull(); // no spare operator to cover it
  });

  it('leaves automated presses alone', () => {
    const factory = createFactory('f1', 'Test');
    const press = readyPress();
    press.automated = true;
    factory.presses.push(press);
    const operator = createEmployee('operator', 'morning', 0, 'Marc');
    factory.employees.push(operator);

    tickOperatorStaffing(factory, MORNING_HOUR);
    expect(press.operatorId).toBeNull();
  });

  it('leaves a press with no mold/material/contract alone even with a free operator', () => {
    const factory = createFactory('f1', 'Test');
    const press = createPress('p1', 'press_60t'); // nothing assigned
    factory.presses.push(press);
    const operator = createEmployee('operator', 'morning', 0, 'Marc');
    factory.employees.push(operator);

    tickOperatorStaffing(factory, MORNING_HOUR);
    expect(press.operatorId).toBeNull();
  });
});
