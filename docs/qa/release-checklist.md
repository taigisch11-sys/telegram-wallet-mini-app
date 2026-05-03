# Release Checklist

Перед публикацией:

- `npm run lint --workspaces`
- `npm run test --workspaces`
- `npm run build --workspaces`
- `npm run qa:ai` при включённой LM Studio
- нет `high` или `blocker` findings в `qa/ai/reports/suite-latest.json`
- проверены env: `VITE_API_URL`, `FRONTEND_ORIGIN`, `TELEGRAM_WEBAPP_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `JWT_SECRET`
- новый пользователь видит нулевые счета и пустые состояния без демо-данных
- можно создать и удалить обычный счёт
- можно создать и удалить долговой счёт
- можно добавить повторяющийся платёж с отличающимся последним платежом
- погашение долга работает как перевод между счётом и долговым счётом
- таймлайн показывает выполненные операции
- демо-режим и обучение включаются из меню и не меняют реальные данные
