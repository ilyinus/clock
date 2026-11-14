const test = require('node:test');
const assert = require('node:assert/strict');
const { createClockModel } = require('../script.js');

test('setTime maps 24-hour input to clock angles and displayed time', () => {
  const clock = createClockModel();
  clock.setTime(0, 0);
  assert.equal(clock.state.hourAngle, 0);
  assert.equal(clock.state.minuteAngle, 0);
  assert.equal(clock.getDisplayedTime(), '00:00');
  clock.setTime(23, 59);
  assert.equal(clock.getDisplayedTime(), '23:59');
  assert.equal(clock.state.hourAngle, 719.5);
});

test('minute hand crossing 12 advances the hour continuously in either direction', () => {
  const clock = createClockModel();
  clock.setTime(11, 59);
  clock.rotateHand('minute', 0, 354);
  assert.ok(clock.state.hourAngle > 359 && clock.state.hourAngle < 361);
  const before = clock.state.hourAngle;
  clock.rotateHand('minute', 354, 0);
  assert.ok(clock.state.hourAngle < before);
});

test('independent hand rotation invalidates displayed time; sync restores consistency', () => {
  const clock = createClockModel();
  clock.setTime(4, 15);
  clock.setSynchronized(false);
  clock.rotateHand('minute', 120, 90);
  assert.equal(clock.getDisplayedTime(), null);
  assert.equal(clock.state.independentPosition, true);
  clock.setSynchronized(true);
  assert.equal(clock.state.independentPosition, false);
  assert.ok(clock.getDisplayedTime());
});
