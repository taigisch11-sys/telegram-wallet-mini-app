# AI-QA для приложения "Финансы"

AI-QA не заменяет тесты. Базовый релизный gate всегда такой:

```bash
npm run qa:base
```

После этого можно включать локальных AI-агентов через LM Studio:

```bash
npm run qa:ai
```

Если LM Studio не запущена, отчёт будет `skipped` и команда не заблокирует разработку. Для строгого режима:

```bash
$env:AI_QA_REQUIRE="1"
npm run qa:release
```

## LM Studio

В LM Studio включите Local Server и загрузите модель. Скрипты используют OpenAI-compatible endpoint:

```env
LMSTUDIO_BASE_URL=http://127.0.0.1:1234/v1
LMSTUDIO_API_KEY=lm-studio
LMSTUDIO_MODEL=local-model-name
AI_QA_TEMPERATURE=0.1
AI_QA_MAX_TOKENS=2048
AI_QA_TIMEOUT_MS=180000
```

Если `LMSTUDIO_MODEL` не задан, скрипт попробует взять первую загруженную модель из `/v1/models`.

## Роли

- `ux-critic`: мобильный Telegram UX, видимость действий, читаемость.
- `qa-navigation`: критические пользовательские маршруты.
- `copy-checker`: русский текст, термины, защита от mojibake.
- `financial-analyst`: баланс, долги, платежи, погашения, графики платежей.
- `regression-guardian`: diff, тестовое покрытие, риск регрессий.

Отчёты пишутся в `qa/ai/reports`. В git хранится только `.gitkeep`, сами отчёты игнорируются.
