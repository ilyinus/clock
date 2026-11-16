'use strict';

// Модель времени. Углы хранят полные обороты, чтобы не терять часы и сутки.
// В пределы одного оборота переводим их только при отображении на циферблате.
function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

function shortestDelta(current, previous) {
  // Переход через верх циферблата должен быть коротким: 359° → 1° означает +2°.
  return ((current - previous + 540) % 360) - 180;
}

function padTimePart(value) {
  return String(value).padStart(2, '0');
}

function createClockModel() {
  const state = {
    hourAngle: 0,
    minuteAngle: 0,
    secondAngle: 0,
    liveTime: false,
    synchronized: true,
    dialStyle: 'arabic',
    showMinutes: false,
    showTime: true,
    independentPosition: false
  };

  function setTime(hours, minutes) {
    if (state.liveTime) return;

    const validHours = Number.isInteger(hours) && hours >= 0 && hours <= 23;
    const validMinutes = Number.isInteger(minutes) && minutes >= 0 && minutes <= 59;
    if (!validHours || !validMinutes) {
      throw new RangeError('Время должно быть от 00:00 до 23:59');
    }

    const totalMinutes = hours * 60 + minutes;
    // За минуту минутная стрелка проходит 6°, а часовая — 0,5°.
    state.minuteAngle = totalMinutes * 6;
    state.hourAngle = totalMinutes * 0.5;
    // Ввод задаёт согласованное положение, но не включает настройку связи.
    state.independentPosition = false;
  }

  function rotateHand(kind, pointerAngle, previousPointerAngle) {
    if (state.liveTime) return 0;
    if (kind !== 'hour' && kind !== 'minute') {
      throw new TypeError('Неизвестная стрелка');
    }

    const delta = shortestDelta(pointerAngle, previousPointerAngle);
    // При связанных стрелках минутная движется в 12 раз быстрее часовой.
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
    if (state.liveTime) {
      // Угол минутной стрелки в живом режиме учитывает секунды: 0,1° за секунду.
      const totalSeconds = Math.round(state.minuteAngle * 10);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor(totalSeconds / 60) % 60;
      const seconds = totalSeconds % 60;
      return `${padTimePart(hours)}:${padTimePart(minutes)}:${padTimePart(seconds)}`;
    }

    if (!state.synchronized || state.independentPosition) return null;

    const totalMinutes = Math.round(state.minuteAngle / 6);
    // Движение назад может дать отрицательный угол; время остаётся в пределах суток.
    const minuteOfDay = ((totalMinutes % 1440) + 1440) % 1440;
    const hours = Math.floor(minuteOfDay / 60);
    const minutes = minuteOfDay % 60;
    return `${padTimePart(hours)}:${padTimePart(minutes)}`;
  }

  function setSynchronized(enabled) {
    if (state.liveTime) return;
    state.synchronized = Boolean(enabled);
    if (!state.synchronized) return;

    // Сохраняем положение минутной стрелки и выбираем ближайший к часовой час.
    const minuteOffset = normalizeAngle(state.minuteAngle) / 12;
    const nearestHour = Math.round((state.hourAngle - minuteOffset) / 30);
    state.hourAngle = minuteOffset + nearestHour * 30;
    state.minuteAngle = state.hourAngle * 12;
    state.independentPosition = false;
  }

  function updateLiveTime(now) {
    if (!state.liveTime) return;

    const seconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    // Секунды влияют на все стрелки, чтобы их положения соответствовали друг другу.
    state.minuteAngle = seconds / 10;
    state.hourAngle = seconds / 120;
    state.secondAngle = now.getSeconds() * 6;
    state.independentPosition = false;
  }

  function setLiveTime(enabled, now) {
    state.liveTime = Boolean(enabled);
    if (state.liveTime) updateLiveTime(now);
    // При выключении сохраняем углы и прежнюю настройку связи стрелок.
  }

  setTime(10, 10);
  return {
    state,
    setTime,
    rotateHand,
    getDisplayedTime,
    setSynchronized,
    setLiveTime,
    updateLiveTime
  };
}

// Четыре фиксированных места для цифр; пустое место обозначается подчёркиванием.
function formatTimeEdit(value, start, end, text, inputType = 'insertText') {
  const slots = /^([0-2_][0-9_]):([0-5_][0-9_])$/.test(value) ? value.split('') : '__:__'.split('');
  let caret = start;
  if (inputType.startsWith('delete')) {
    if (start !== end) {
      for (let index = start; index < end; index++) {
        if (index !== 2) slots[index] = '_';
      }
    } else {
      let index = inputType.endsWith('Backward') ? start - 1 : start;
      if (index === 2) index += inputType.endsWith('Backward') ? -1 : 1;
      if (index >= 0 && index < 5) {
        slots[index] = '_';
        caret = index;
      }
    }
  } else {
    for (const digit of text || '') {
      if (digit === ':') continue;
      const index = caret === 2 ? 3 : caret;
      if (!/^[0-9]$/.test(digit) || index >= 5) continue;
      const maximum = index === 0 ? 2 : index === 1 && slots[0] === '2' ? 3 : index === 3 ? 5 : 9;
      if (Number(digit) > maximum) continue;
      slots[index] = digit;
      // После смены десятков часов 19 → 2_ ждём допустимую вторую цифру.
      if (index === 0 && digit === '2' && slots[1] > '3') slots[1] = '_';
      caret = index + 1;
      if (caret === 2) caret = 3;
    }
  }
  return { value: slots.join(''), start: caret, end: caret };
}

// Node подключает модель без запуска браузерной части.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createClockModel, normalizeAngle, shortestDelta, formatTimeEdit };
}

function startClock() {
  const clock = createClockModel();
  // Эти размеры соответствуют viewBox и центру стрелок в index.html.
  const DIAL_SIZE = 440;
  const DIAL_CENTER = DIAL_SIZE / 2;
  const TICK_OUTER_RADIUS = 181;
  const HOUR_TICK_INNER_RADIUS = 169;
  const MINUTE_TICK_INNER_RADIUS = 172;
  const HOUR_LABEL_RADIUS = 132;
  const MINUTE_LABEL_RADIUS = 199;
  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  const ROMAN_HOURS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  const elements = {
    face: document.getElementById('clock-face'),
    hourHand: document.getElementById('hour-hand'),
    minuteHand: document.getElementById('minute-hand'),
    secondHand: document.getElementById('second-hand'),
    liveTime: document.getElementById('live-time'),
    hourMarks: document.getElementById('hour-marks'),
    minuteMarks: document.getElementById('minute-marks'),
    hourLabels: document.getElementById('hour-labels'),
    minuteLabels: document.getElementById('minute-labels'),
    timeControls: document.getElementById('time-controls'),
    timeInput: document.getElementById('time-input'),
    showTime: document.getElementById('show-time'),
    showMinutes: document.getElementById('show-minutes'),
    syncMode: document.getElementById('sync-mode')
  };

  let drag = null;
  let liveTimer = null;
  let beforeEdit = null;

  // Построение циферблата.
  function svgElement(tag, attributes, text) {
    const node = document.createElementNS(SVG_NAMESPACE, tag);
    for (const [name, value] of Object.entries(attributes)) {
      node.setAttribute(name, value);
    }
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function pointAt(radius, angle) {
    const radians = angle * Math.PI / 180;
    // Нулевой угол смотрит вверх, положительный идёт по часовой стрелке.
    return {
      x: DIAL_CENTER + Math.sin(radians) * radius,
      y: DIAL_CENTER - Math.cos(radians) * radius
    };
  }

  function drawMarks() {
    elements.hourMarks.replaceChildren();
    elements.minuteMarks.replaceChildren();
    for (let minute = 0; minute < 60; minute++) {
      const angle = minute * 6;
      const isHourMark = minute % 5 === 0;
      const innerRadius = isHourMark ? HOUR_TICK_INNER_RADIUS : MINUTE_TICK_INNER_RADIUS;
      const from = pointAt(innerRadius, angle);
      const to = pointAt(TICK_OUTER_RADIUS, angle);
      const group = isHourMark ? elements.hourMarks : elements.minuteMarks;
      group.append(svgElement('line', {
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        class: isHourMark ? 'tick major' : 'tick'
      }));
    }
  }

  function drawHourLabels() {
    elements.hourLabels.replaceChildren();
    const style = clock.state.dialStyle;
    if (style === 'none') return;

    for (let hour = 1; hour <= 12; hour++) {
      const point = pointAt(HOUR_LABEL_RADIUS, hour * 30);
      const label = style === 'roman' ? ROMAN_HOURS[hour] : String(hour);
      elements.hourLabels.append(svgElement('text', {
        x: point.x,
        y: point.y,
        class: 'hour-number'
      }, label));
    }
  }

  function drawMinuteLabels() {
    elements.minuteLabels.replaceChildren();
    elements.minuteLabels.hidden = !clock.state.showMinutes;
    if (!clock.state.showMinutes) return;

    for (let minute = 0; minute < 60; minute += 5) {
      const point = pointAt(MINUTE_LABEL_RADIUS, minute * 6);
      elements.minuteLabels.append(svgElement('text', {
        x: point.x,
        y: point.y,
        class: 'minute-number'
      }, padTimePart(minute)));
    }
  }

  function drawDial() {
    drawMarks();
    drawHourLabels();
    drawMinuteLabels();
  }

  // Отображение модели и доступности управления.
  function renderHands() {
    const hourAngle = normalizeAngle(clock.state.hourAngle);
    const minuteAngle = normalizeAngle(clock.state.minuteAngle);
    elements.hourHand.setAttribute('transform', `rotate(${hourAngle} ${DIAL_CENTER} ${DIAL_CENTER})`);
    elements.minuteHand.setAttribute('transform', `rotate(${minuteAngle} ${DIAL_CENTER} ${DIAL_CENTER})`);
    elements.secondHand.setAttribute('transform', `rotate(${clock.state.secondAngle} ${DIAL_CENTER} ${DIAL_CENTER})`);
    elements.secondHand.setAttribute('visibility', clock.state.liveTime ? 'visible' : 'hidden');
  }

  function renderManualControls() {
    for (const hand of [elements.hourHand, elements.minuteHand]) {
      hand.setAttribute('aria-disabled', String(clock.state.liveTime));
    }
    elements.timeInput.readOnly = clock.state.liveTime;
    elements.syncMode.disabled = clock.state.liveTime;
  }

  function renderTimeInput() {
    // Живое время отображается даже при выключенной связи. При независимом
    // положении поле очищается; при выключенной связи введённый текст сохраняется.
    if (clock.state.liveTime || clock.state.synchronized) {
      elements.timeInput.value = clock.getDisplayedTime() || '__:__';
    } else if (clock.state.independentPosition) {
      elements.timeInput.value = '__:__';
    }
  }

  function render() {
    renderHands();
    renderManualControls();
    renderTimeInput();
  }

  // Перетаскивание стрелок.
  function pointerAngle(event) {
    const rect = elements.face.getBoundingClientRect();
    // Переводим координаты указателя из экранных пикселей в координаты SVG.
    const x = (event.clientX - rect.left) * (DIAL_SIZE / rect.width);
    const y = (event.clientY - rect.top) * (DIAL_SIZE / rect.height);
    return normalizeAngle(Math.atan2(x - DIAL_CENTER, DIAL_CENTER - y) * 180 / Math.PI);
  }

  function endDrag() {
    if (!drag) return;
    const hand = drag.hand;
    try {
      if (hand.hasPointerCapture(drag.pointerId)) hand.releasePointerCapture(drag.pointerId);
    } catch (_) {
      // Браузер мог уже освободить указатель при завершении или отмене жеста.
    }
    hand.classList.remove('dragging');
    drag = null;
    render();
  }

  function bindHandEvents(kind, hand) {
    function startDrag(event) {
      if (clock.state.liveTime) return;
      event.preventDefault();
      hand.setPointerCapture(event.pointerId);
      hand.classList.add('dragging');
      drag = { kind, hand, pointerId: event.pointerId, angle: pointerAngle(event) };
    }

    function moveDrag(event) {
      if (!drag || drag.hand !== hand || drag.pointerId !== event.pointerId) return;
      const nextAngle = pointerAngle(event);
      clock.rotateHand(kind, nextAngle, drag.angle);
      drag.angle = nextAngle;
      render();
    }

    hand.addEventListener('pointerdown', startDrag);
    hand.addEventListener('pointermove', moveDrag);
    hand.addEventListener('pointerup', endDrag);
    hand.addEventListener('pointercancel', endDrag);
    hand.addEventListener('lostpointercapture', endDrag);
  }

  // Ручной ввод времени и маска ЧЧ:ММ.
  function applyTime() {
    if (clock.state.liveTime) return;
    const match = /^([01][0-9]|2[0-3]):([0-5][0-9])$/.exec(elements.timeInput.value.trim());
    if (!match) return;
    clock.setTime(Number(match[1]), Number(match[2]));
    // Не перезаписываем поле: при редактировании нужно сохранить курсор и выделение.
    renderHands();
  }

  function rememberTimeEdit() {
    const input = elements.timeInput;
    beforeEdit = { value: input.value, start: input.selectionStart, end: input.selectionEnd };
  }

  function commitTimeEdit(edit) {
    elements.timeInput.value = edit.value;
    elements.timeInput.setSelectionRange(edit.start, edit.end);
    beforeEdit = null;
    applyTime();
  }

  function handleBeforeTimeInput(event) {
    if (elements.timeInput.readOnly) return;
    if (!beforeEdit) rememberTimeEdit();
    if (event.isComposing || !event.cancelable) return;
    event.preventDefault();
    const { value, start, end } = beforeEdit;
    commitTimeEdit(formatTimeEdit(value, start, end, event.data, event.inputType));
  }

  function handleTimeInput(event) {
    const input = elements.timeInput;
    if (input.readOnly || event.isComposing) return;
    // Некоторые мобильные браузеры не позволяют отменить beforeinput.
    // В этом случае восстанавливаем фиксированные позиции после изменения DOM.
    const previous = beforeEdit || { value: '__:__', start: 0, end: 5 };
    const insertedLength = input.value.length - previous.value.length + previous.end - previous.start;
    const text = event.data ?? input.value.slice(previous.start, previous.start + Math.max(0, insertedLength));
    commitTimeEdit(formatTimeEdit(previous.value, previous.start, previous.end, text, event.inputType));
  }

  function startTimeEntry() {
    if (elements.timeInput.readOnly) return;
    elements.timeInput.setSelectionRange(0, 0);
    beforeEdit = null;
  }

  function pasteTime(event) {
    if (elements.timeInput.readOnly) return;
    event.preventDefault();
    rememberTimeEdit();
    const { value, start, end } = beforeEdit;
    commitTimeEdit(formatTimeEdit(value, start, end, event.clipboardData.getData('text')));
  }

  function bindTimeInputEvents() {
    elements.timeInput.addEventListener('focus', startTimeEntry);
    elements.timeInput.addEventListener('click', startTimeEntry);
    elements.timeInput.addEventListener('beforeinput', handleBeforeTimeInput);
    elements.timeInput.addEventListener('input', handleTimeInput);
    elements.timeInput.addEventListener('paste', pasteTime);
    elements.timeInput.addEventListener('compositionstart', rememberTimeEdit);
    elements.timeInput.addEventListener('compositionend', handleTimeInput);
  }

  // Живое время: источник истины — часы устройства, а не число срабатываний таймера.
  function updateLiveTime() {
    clearTimeout(liveTimer);
    if (!clock.state.liveTime) return;
    const now = new Date();
    clock.updateLiveTime(now);
    render();
    // Планируем обновление на границе следующей секунды, чтобы не копить задержку.
    liveTimer = setTimeout(updateLiveTime, 1000 - now.getMilliseconds());
  }

  function changeLiveTime() {
    endDrag();
    clearTimeout(liveTimer);
    clock.setLiveTime(elements.liveTime.checked, new Date());
    if (clock.state.liveTime) {
      updateLiveTime();
    } else if (!clock.state.synchronized) {
      elements.timeInput.value = '__:__';
    }
    render();
  }

  // Настройки и запуск интерфейса.
  function changeShowTime() {
    clock.state.showTime = elements.showTime.checked;
    elements.timeControls.hidden = !clock.state.showTime;
  }

  function changeShowMinutes() {
    clock.state.showMinutes = elements.showMinutes.checked;
    drawDial();
  }

  function changeSynchronization() {
    clock.setSynchronized(elements.syncMode.checked);
    render();
  }

  function changeDialStyle(event) {
    const radio = event.currentTarget;
    if (!radio.checked) return;
    clock.state.dialStyle = radio.value;
    drawDial();
  }

  function bindSettingsEvents() {
    elements.liveTime.addEventListener('change', changeLiveTime);
    document.addEventListener('visibilitychange', updateLiveTime);
    elements.showTime.addEventListener('change', changeShowTime);
    elements.showMinutes.addEventListener('change', changeShowMinutes);
    elements.syncMode.addEventListener('change', changeSynchronization);
    for (const radio of document.querySelectorAll('input[name="dial-style"]')) {
      radio.addEventListener('change', changeDialStyle);
    }
  }

  bindHandEvents('hour', elements.hourHand);
  bindHandEvents('minute', elements.minuteHand);
  bindTimeInputEvents();
  bindSettingsEvents();
  drawDial();
  render();
}

if (typeof document !== 'undefined') {
  startClock();
}
