'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { formatTimeEdit } = require('../script.js');

test('typing overwrites one slot and skips the fixed colon', () => {
  let edit = formatTimeEdit('10:10', 0, 0, '2');
  assert.deepEqual(edit, { value: '20:10', start: 1, end: 1 });
  edit = formatTimeEdit(edit.value, edit.start, edit.end, '3');
  assert.deepEqual(edit, { value: '23:10', start: 3, end: 3 });
  edit = formatTimeEdit(edit.value, edit.start, edit.end, '5');
  assert.deepEqual(edit, { value: '23:50', start: 4, end: 4 });
});

test('invalid digits leave the value and caret unchanged at every position', () => {
  for (const [position, digit] of [[0, '3'], [1, '4'], [3, '6'], [4, 'a']]) {
    assert.deepEqual(formatTimeEdit('23:59', position, position, digit), {
      value: '23:59', start: position, end: position
    });
  }
  assert.deepEqual(formatTimeEdit('23:59', 2, 2, '6'), {
    value: '23:59', start: 2, end: 2
  });
});

test('changing hour tens permits entering 20–23 after 19', () => {
  const first = formatTimeEdit('19:45', 0, 0, '2');
  assert.deepEqual(first, { value: '2_:45', start: 1, end: 1 });
  assert.deepEqual(formatTimeEdit(first.value, 1, 1, '3'), {
    value: '23:45', start: 3, end: 3
  });
});

test('deleting digits and selections never moves or removes the colon', () => {
  assert.deepEqual(formatTimeEdit('12:34', 3, 3, '', 'deleteContentBackward'), {
    value: '1_:34', start: 1, end: 1
  });
  assert.deepEqual(formatTimeEdit('12:34', 2, 2, '', 'deleteContentForward'), {
    value: '12:_4', start: 3, end: 3
  });
  assert.deepEqual(formatTimeEdit('12:34', 0, 5, '', 'deleteContentBackward'), {
    value: '__:__', start: 0, end: 0
  });
});

test('paste and empty independent time use the same fixed positions', () => {
  assert.deepEqual(formatTimeEdit('10:10', 0, 5, '23:59'), {
    value: '23:59', start: 5, end: 5
  });
  assert.deepEqual(formatTimeEdit('', 0, 0, '1234'), {
    value: '12:34', start: 5, end: 5
  });
});
