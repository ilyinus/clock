# Исследование кодовой базы

## Где находится код

- `index.html` — русский интерфейс, SVG циферблата, поле ввода времени и настройки. `script.js` подключён с `defer`.
- `style.css` — все стили в коротких CSS-правилах; мобильная сетка задаётся в `@media (max-width: 540px)`.
- `script.js` — модель `createClockModel()` и DOM/SVG-логика внутри `if (typeof document !== 'undefined')`.
- `tests/clock.test.js` — Node-тесты чистой модели; DOM не нужен.
- Внешних зависимостей/манифеста пакетов нет.

## Команды проекта

- `node --check script.js` — проверка синтаксиса.
- `node --test tests/clock.test.js` — 5 тестов модели времени.
- `open index.html` — открыть приложение (в AGENTS.md отмечено, что `file://` запуск не подтверждён проверкой).

Стили написаны обычными CSS-правилами без препроцессора; разметка компактная, с семантическими элементами и русскими подписями. Состояние хранится в JS-модели, DOM отображает его.

## Настройки, fieldset и legend

Разметка находится в `<section class="settings">` в `index.html`.

- Первая ячейка — `<fieldset>` с `<legend>Подписи часов</legend>` и `.choice-row` с radio `input[name="dial-style"]` (`arabic`, `roman`, `none`).
- Остальные элементы — `.toggle-row`: `#show-minutes`, `#sync-mode`, `#show-time`.
- Общая сетка: `.settings { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; ... }`; на ширине до 540px становится одна колонка и gap 8px.
- Общая карточная геометрия уже задана правилом `fieldset, .toggle-row` (min-width, margin, padding, border, radius, background).
- `legend` сейчас имеет `padding: 0 5px`, размер .85rem и жирность 800. Это главный селектор для правки размера/вертикального выравнивания легенды. У fieldset браузерные внутренние отступы/легенда могут давать отличие высоты от `.toggle-row`; смотреть совместно на `fieldset`, `legend`, `.choice-row` и их padding/line-height, а также на grid stretch.
- У `.toggle-row` `display:flex; align-items:center; justify-content:space-between`, что вертикально центрирует контроль относительно текста. Если надо выровнять карточки первой строки, сравнивать содержимое fieldset с этой схемой.

## Вертикальное выравнивание интерфейса

Основные вертикальные точки управления:

- `.app` — верхний padding 34px, мобильный 22px.
- `.heading` — нижний margin 18px.
- `.clock-panel` — padding 14px 24px 18px, мобильный 10px 12px 15px.
- `.clock-face` — block, ширина до 410px (мобильный до 370px), центрируется через `margin: 0 auto`; SVG имеет viewBox 400×400.
- `#time-controls.time-controls` — `margin: 2px auto 0`; `.time-controls label` — нижний margin 6px.
- `.status` — margin сверху 10px, `min-height: 1.25em`; статус находится в `#time-message` после time-controls внутри `.clock-panel`.
- `.settings` — margin сверху 17px.

Порядок в панели: циферблат, блок ввода времени, статус. Если требуется вертикально сдвинуть поле/статус, точные цели — `.time-controls`, `.status` и внутренний layout SVG `.clock-face`; высота SVG следует из его квадратного viewBox и CSS ширины.

## Расстояние подписей минут в SVG

Генерация в `script.js:drawDial()`:

- Группа для подписей — `<g id="minute-labels">` в SVG `index.html`, доступ через `elements.minuteLabels`.
- 12 подписей создаются при `clock.state.showMinutes`, с шагом 5 минут: `for (let minute = 0; minute < 60; minute += 5)`.
- Радиус задаётся аргументом `pointAt(157, minute * 6)`; это ключевое значение для радиального расстояния от центра (200,200). Часовые цифры стоят на радиусе 142, минутные деления доходят до 181, поэтому подписи на 157 располагаются между ними.
- Вид текста определяется `.minute-number` в CSS (размер 11px, baseline central). Для расстояния/плотности менять радиус 157; не затрагивать угловой шаг, если цель только отодвинуть числа от отметок/края.

## Применение времени и сообщение статуса

- `applyTime()` проверяет формат `ЧЧ:ММ` и границы. При валидном вводе вызывает `clock.setTime(...)`, затем `render('Время выставлено.')`.
- `createClockModel().setTime()` устанавливает обе стрелки и сбрасывает `state.independentPosition = false`, но не включает `state.synchronized`.
- `render(message)` сначала обрабатывает `independentPosition`; иначе обновляет поле и сообщение только внутри `else if (clock.state.synchronized)`. Поэтому после ввода валидного времени при выключенной синхронизации состояние уже не независимое, синхронизация выключена, и `render('Время выставлено.')` не вызывает `setStatus`: прежний статус остаётся. Это совпадает с известным багом из carried.md.
- Локальная зона изменения: успешная ветка `applyTime()` и/или ветвление `render(message)`. Нужно сохранить прежнее поведение для независимого вращения и синхронизированного отображения. `setStatus(message, error = false)` пишет в `#time-message` и переключает `.error`.
