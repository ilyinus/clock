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

test('initial 10:10 stays consistent when either hand rotates', () => {
  const clock = createClockModel();
  assert.equal(clock.getDisplayedTime(), '10:10');
  assert.equal(clock.state.hourAngle, 305);
  assert.equal(clock.state.minuteAngle % 360, 60);
  clock.rotateHand('minute', 66, 60);
  assert.equal(clock.getDisplayedTime(), '10:11');
  assert.equal(clock.state.hourAngle, 305.5);
  clock.rotateHand('hour', 335.5, 305.5);
  assert.equal(clock.getDisplayedTime(), '11:11');
  assert.equal(clock.state.hourAngle, 335.5);
  assert.equal(clock.state.minuteAngle % 360, 66);
});

test('restoring synchronization selects the nearest hour and preserves minute position', () => {
  const clock = createClockModel();
  clock.setTime(4, 15);
  clock.setSynchronized(false);
  clock.rotateHand('hour', 187.5, 127.5);
  clock.setSynchronized(true);
  assert.equal(clock.state.hourAngle, 187.5);
  assert.equal(clock.state.minuteAngle % 360, 90);
  assert.equal(clock.getDisplayedTime(), '06:15');
  clock.rotateHand('minute', 96, 90);
  assert.equal(clock.state.hourAngle, 188);
  assert.equal(clock.getDisplayedTime(), '06:16');
  clock.rotateHand('hour', 158, 188);
  assert.equal(clock.state.minuteAngle % 360, 96);
  assert.equal(clock.getDisplayedTime(), '05:16');
});
