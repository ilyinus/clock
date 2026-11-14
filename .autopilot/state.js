window.STATE =
{
  "version": 2,
  "slug": "clock-switches",
  "dir": "2026-11-15-clock-switches--wip",
  "title": "Подписи циферблата и тумблеры настроек",
  "mode": "semi",
  "depth": "normal",
  "tier": "T0",
  "briefFile": "2026-11-15-brief.md",
  "memoryFile": "AGENTS.md",
  "memoryOwner": "autopilot",
  "skillDir": "/Users/andrei/.agents/skills/autopilot",
  "baseCommit": null,
  "startedAt": "2026-11-15T01:11:55+03:00",
  "updatedAt": "2026-11-15T01:14:01+03:00",
  "finishedAt": null,
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-11-15T01:11:55+03:00",
      "finishedAt": "2026-11-15T01:12:27+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-11-15T01:12:27+03:00",
      "finishedAt": "2026-11-15T01:12:28+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "startedAt": "2026-11-15T01:12:28+03:00",
      "finishedAt": "2026-11-15T01:12:28+03:00",
      "note": "Вопросов не потребовалось: все правки определены"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-11-15T01:12:28+03:00",
      "finishedAt": "2026-11-15T01:14:01+03:00"
    },
    {
      "id": "plan",
      "status": "active",
      "startedAt": "2026-11-15T01:14:01+03:00"
    },
    {
      "id": "build",
      "status": "pending"
    },
    {
      "id": "review",
      "status": "pending"
    },
    {
      "id": "final",
      "status": "pending"
    }
  ],
  "requirements": {
    "total": 6,
    "done": 0,
    "inTicket": 6,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Подписи циферблата и тумблеры настроек",
      "requirements": [
        "R22",
        "R23",
        "R24",
        "R25",
        "R26",
        "R27"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "index.html",
        "style.css",
        "script.js"
      ],
      "review": "нет",
      "model": "обычная",
      "status": "pending",
      "retries": 0,
      "repairs": 0
    }
  ],
  "tests": null,
  "debt": {
    "placeholders": [],
    "assumptions": [],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "found": 0,
    "fixed": 0,
    "deferred": 0,
    "items": []
  },
  "concerns": [],
  "blind": null,
  "beats": [
    "2026-11-15T01:11:55+03:00",
    "2026-11-15T01:12:27+03:00",
    "2026-11-15T01:12:28+03:00",
    "2026-11-15T01:14:01+03:00"
  ],
  "rev": 13,
  "waiting": null,
  "waits": [],
  "log": [
    {
      "t": "2026-11-15T01:11:55+03:00",
      "k": "init"
    },
    {
      "t": "2026-11-15T01:12:27+03:00",
      "k": "stage",
      "id": "manifest",
      "act": "start"
    },
    {
      "t": "2026-11-15T01:12:28+03:00",
      "k": "stage",
      "id": "briefing",
      "act": "skip",
      "note": "Вопросов не потребовалось: все правки определены"
    },
    {
      "t": "2026-11-15T01:12:28+03:00",
      "k": "gate",
      "g": "G1",
      "ok": true,
      "open": 0,
      "total": 6
    },
    {
      "t": "2026-11-15T01:12:28+03:00",
      "k": "stage",
      "id": "spec",
      "act": "start"
    },
    {
      "t": "2026-11-15T01:14:01+03:00",
      "k": "gate",
      "g": "G2",
      "ok": true,
      "found": 0,
      "fixed": 0,
      "deferred": 0
    },
    {
      "t": "2026-11-15T01:14:01+03:00",
      "k": "stage",
      "id": "plan",
      "act": "start"
    },
    {
      "t": "2026-11-15T01:14:01+03:00",
      "k": "tier",
      "v": "T0"
    },
    {
      "t": "2026-11-15T01:14:01+03:00",
      "k": "tickets",
      "n": 1
    },
    {
      "t": "2026-11-15T01:14:01+03:00",
      "k": "gate",
      "g": "G3",
      "ok": true,
      "problems": 0
    }
  ],
  "reqList": [
    {
      "id": "R22",
      "text": "«Подписи минут вынести за циферблат»",
      "status": "in-ticket"
    },
    {
      "id": "R23",
      "text": "«Увеличить шрифт подписей часов»",
      "status": "in-ticket"
    },
    {
      "id": "R24",
      "text": "«сделать их ближе к делениям на циферблате»",
      "status": "in-ticket"
    },
    {
      "id": "R25",
      "text": "«опции, которые управляются чекбоксами сделать в виде тумблеров как на айфоне»",
      "status": "in-ticket"
    },
    {
      "id": "R26",
      "text": "«Переключалку подписей часов отставить в виде кнопок»",
      "status": "in-ticket"
    },
    {
      "id": "R27",
      "text": "«Каждая опция на новой строке»",
      "status": "in-ticket"
    }
  ],
  "gates": {
    "G1": {
      "ok": true,
      "at": "2026-11-15T01:12:28+03:00",
      "open": 0,
      "total": 6
    },
    "G2": {
      "ok": true,
      "at": "2026-11-15T01:14:01+03:00",
      "found": 0,
      "fixed": 0,
      "deferred": 0
    },
    "G3": {
      "ok": true,
      "at": "2026-11-15T01:14:01+03:00",
      "problems": 0
    }
  },
  "result": null
}
