# Санталь Смена

Telegram Mini App для подбора смен администраторов медицинской клиники. Приложение публикуется как один Cloudflare Worker: он отдает мобильный интерфейс, API, Telegram webhook и слой синхронизации с Google Sheets.

## Локальный запуск

```bash
npm install
npm run test --workspace @santal/shift
npm run build --workspace @santal/shift
npm run dev --workspace @santal/shift
```

## Google Sheets

Таблица задается переменной `GOOGLE_SHEET_ID`. Для записи нужен service account, которому выдан доступ редактора к таблице:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `ADMIN_SETUP_TOKEN`

После деплоя структура листов создается запросом:

```bash
curl -X POST -H "Authorization: Bearer <ADMIN_SETUP_TOKEN>" https://santal-shift-app.taigisch11.workers.dev/api/admin/setup-sheet
```

Листы: `Настройки_клиники`, `Филиалы`, `Администраторы`, `Смены`, `Заявки`, `Назначения`, `Ставки`, `Праздники`, `Истории_новости`, `Выплаты`, `Начисления`, `Шахматка`, `Справочники`, `Аудит_лог`, `Sync_State`.

`Назначения` хранит связь сотрудника и смены с фактами подтверждения, отметки выхода, завершения и отмены. `Начисления` хранит проверяемые строки выплат по каждой смене, чтобы будущие изменения ставок не ломали историю. `Шахматка` содержит не только агрегат филиала за день, но и строки конкретных смен со слотами времени и назначенными администраторами.

## Telegram

Секреты Worker:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`

GitHub Actions workflow `deploy-santal-shift.yml` деплоит Worker, записывает секреты, настраивает Menu Button и webhook.
