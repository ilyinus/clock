'use strict';

function normalizeAngle(angle) { return ((angle % 360) + 360) % 360; }
function shortestDelta(current, previous) {
  return ((current - previous + 540) % 360) - 180;
}

function createClockModel() {
  const state = { hourAngle: 305, minuteAngle: 60, synchronized: true, dialStyle: 'arabic', showMinutes: false, showTime: true, independentPosition: false };
  function setTime(hours, minutes) {
    if (!Number.isInteger(hours) || hours < 0 || hours > 23 || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) throw new RangeError('Время должно быть от 00:00 до 23:59');
    const total = hours * 60 + minutes;
    state.minuteAngle = total * 6;
    state.hourAngle = total * 0.5;
    state.independentPosition = false;
  }
  function rotateHand(kind, pointerAngle, previousPointerAngle) {
    if (kind !== 'hour' && kind !== 'minute') throw new TypeError('Неизвестная стрелка');
    const delta = shortestDelta(pointerAngle, previousPointerAngle);
    if (kind === 'minute') {
      state.minuteAngle += delta;
      if (state.synchronized) state.hourAngle += delta / 12;
    } else {
      state.hourAngle += delta;
      if (state.synchronized) state.minuteAngle += delta * 12;
    }
    if (!state.synchronized) state.independentPosition = true;
    return delta;
  }
  function getDisplayedTime() {
    if (!state.synchronized || state.independentPosition) return null;
    const totalMinutes = Math.round(state.minuteAngle / 6);
    const minuteOfDay = ((totalMinutes % 1440) + 1440) % 1440;
    return `${String(Math.floor(minuteOfDay / 60)).padStart(2, '0')}:${String(minuteOfDay % 60).padStart(2, '0')}`;
  }
  function setSynchronized(enabled) {
    state.synchronized = Boolean(enabled);
    if (state.synchronized) {
      const base = normalizeAngle(state.minuteAngle) / 12;
      state.hourAngle = base + Math.round((state.hourAngle - base) / 30) * 30;
      state.minuteAngle = state.hourAngle * 12;
      state.independentPosition = false;
    }
  }
  setTime(10, 10);
  return { state, setTime, rotateHand, getDisplayedTime, setSynchronized };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { createClockModel, normalizeAngle, shortestDelta };

if (typeof document !== 'undefined') {
  const clock = createClockModel();
  const svgNS = 'http://www.w3.org/2000/svg';
  const elements = {
    face: document.getElementById('clock-face'), hourHand: document.getElementById('hour-hand'), minuteHand: document.getElementById('minute-hand'),
    hourMarks: document.getElementById('hour-marks'), minuteMarks: document.getElementById('minute-marks'), hourLabels: document.getElementById('hour-labels'), minuteLabels: document.getElementById('minute-labels'),
    timeControls: document.getElementById('time-controls'), timeInput: document.getElementById('time-input'), timeMessage: document.getElementById('time-message'), setTime: document.getElementById('set-time'), showTime: document.getElementById('show-time'), showMinutes: document.getElementById('show-minutes'), syncMode: document.getElementById('sync-mode')
  };
  let drag = null;
  const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  function svgElement(tag, attrs, text) {
    const node = document.createElementNS(svgNS, tag);
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function pointAt(radius, angle) {
    const rad = angle * Math.PI / 180;
    return { x: 200 + Math.sin(rad) * radius, y: 200 - Math.cos(rad) * radius };
  }
  function drawDial() {
    elements.hourMarks.replaceChildren(); elements.minuteMarks.replaceChildren(); elements.hourLabels.replaceChildren(); elements.minuteLabels.replaceChildren();
    for (let i = 0; i < 60; i++) {
      const angle = i * 6, major = i % 5 === 0;
      const from = pointAt(major ? 169 : 172, angle), to = pointAt(181, angle);
      (major ? elements.hourMarks : elements.minuteMarks).append(svgElement('line', { x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: `tick${major ? ' major' : ''}` }));
    }
    const style = clock.state.dialStyle;
    if (style !== 'none') for (let hour = 1; hour <= 12; hour++) {
      const p = pointAt(120, hour * 30);
      elements.hourLabels.append(svgElement('text', { x: p.x, y: p.y, class: 'hour-number' }, style === 'roman' ? roman[hour] : String(hour)));
    }
    elements.minuteLabels.hidden = !clock.state.showMinutes;
    if (clock.state.showMinutes) for (let minute = 0; minute < 60; minute += 5) {
      const p = pointAt(152, minute * 6);
      elements.minuteLabels.append(svgElement('text', { x: p.x, y: p.y, class: 'minute-number' }, String(minute).padStart(2, '0')));
    }
  }
  function render(message) {
    const hourAngle = normalizeAngle(clock.state.hourAngle), minuteAngle = normalizeAngle(clock.state.minuteAngle);
    elements.hourHand.setAttribute('transform', `rotate(${hourAngle} 200 200)`);
    elements.minuteHand.setAttribute('transform', `rotate(${minuteAngle} 200 200)`);
    elements.hourHand.setAttribute('aria-valuenow', String(Math.round(hourAngle)));
    elements.minuteHand.setAttribute('aria-valuenow', String(Math.round(minuteAngle)));
    if (clock.state.independentPosition) {
      elements.timeInput.value = '';
      setStatus('Стрелки установлены независимо. Выставь время цифрами, чтобы связать их.');
    } else if (clock.state.synchronized) {
      elements.timeInput.value = clock.getDisplayedTime();
      if (message) setStatus(message);
    } else if (message) {
      setStatus(message);
    }
  }
  function setStatus(message, error = false) {
    elements.timeMessage.textContent = message;
    elements.timeMessage.classList.toggle('error', error);
  }
  function applyTime() {
    const match = /^(\d{2}):(\d{2})$/.exec(elements.timeInput.value.trim());
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) { setStatus('Введи время от 00:00 до 23:59 в формате ЧЧ:ММ.', true); return; }
    clock.setTime(Number(match[1]), Number(match[2]));
    render('Время выставлено.');
  }
  function pointerAngle(event) {
    const rect = elements.face.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (400 / rect.width), y = (event.clientY - rect.top) * (400 / rect.height);
    return normalizeAngle(Math.atan2(x - 200, 200 - y) * 180 / Math.PI);
  }
  function endDrag() {
    if (!drag) return;
    const hand = drag.hand;
    try { if (hand.hasPointerCapture(drag.pointerId)) hand.releasePointerCapture(drag.pointerId); } catch (_) { /* capture may already be released */ }
    hand.classList.remove('dragging'); drag = null;
    render();
  }
  for (const [kind, hand] of [['hour', elements.hourHand], ['minute', elements.minuteHand]]) {
    hand.addEventListener('pointerdown', event => {
      event.preventDefault(); hand.setPointerCapture(event.pointerId); hand.classList.add('dragging'); drag = { kind, hand, pointerId: event.pointerId, angle: pointerAngle(event) };
    });
    hand.addEventListener('pointermove', event => {
      if (!drag || drag.hand !== hand || drag.pointerId !== event.pointerId) return;
      const next = pointerAngle(event);
      clock.rotateHand(kind, next, drag.angle); drag.angle = next; render();
    });
    hand.addEventListener('pointerup', endDrag);
    hand.addEventListener('pointercancel', endDrag);
    hand.addEventListener('lostpointercapture', endDrag);
    hand.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault(); const direction = ['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : -1;
      const delta = (event.shiftKey ? 6 : 1) * direction;
      clock.rotateHand(kind, delta, 0); render();
    });
  }
  elements.setTime.addEventListener('click', applyTime);
  elements.timeInput.addEventListener('keydown', event => { if (event.key === 'Enter') applyTime(); });
  elements.showTime.addEventListener('change', () => { clock.state.showTime = elements.showTime.checked; elements.timeControls.hidden = !clock.state.showTime; });
  elements.showMinutes.addEventListener('change', () => { clock.state.showMinutes = elements.showMinutes.checked; drawDial(); });
  elements.syncMode.addEventListener('change', () => {
    clock.setSynchronized(elements.syncMode.checked);
    render(elements.syncMode.checked ? 'Стрелки снова связаны.' : 'Стрелки можно двигать независимо.');
  });
  for (const radio of document.querySelectorAll('input[name="dial-style"]')) radio.addEventListener('change', () => { if (radio.checked) { clock.state.dialStyle = radio.value; drawDial(); } });
  drawDial(); render('Потяни за любую стрелку.');
}
