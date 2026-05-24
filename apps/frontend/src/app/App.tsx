import type { AccountDto, DashboardStateDto, DebtDto, TimeseriesPointDto, UpcomingEventDto } from "@wallet/shared";
import {
  Activity,
  ArrowRight,
  CreditCard,
  Landmark,
  LineChart,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  WalletCards
} from "lucide-react";
import { startTransition, useEffect, useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Button } from "../components/editorial/button";
import { Card } from "../components/editorial/card";
import { EmptyState } from "../components/editorial/empty-state";
import { BottomNav } from "../components/editorial/bottom-nav";
import { Metric } from "../components/editorial/metric";
import { SectionTitle } from "../components/editorial/section-title";
import { buildTokenVars } from "../design/tokens";
import { useWalletState } from "../hooks/use-state";
import { money, shortDate } from "../lib/format";
import { demoState, demoTimeseries } from "../mock/state";

type MainScreen = "home" | "detail" | "analytics" | "settings";
type LegacyScreen = "wallet" | "plan" | "accounts" | "charts" | "history" | "menu";
export type Screen = "welcome" | MainScreen | LegacyScreen;

const currentMonthLabel = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(new Date());

export function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [demoData, setDemoData] = useState<DashboardStateDto>(demoState);
  const [localMode, setLocalMode] = useState(false);
  const [loadingHelpVisible, setLoadingHelpVisible] = useState(false);
  const realWallet = useWalletState();

  const demoWallet: ReturnType<typeof useWalletState> = {
    data: demoData,
    loading: false,
    error: null,
    remoteAvailable: false,
    refresh: async () => {},
    setData: (next) => {
      setDemoData((current) => (typeof next === "function" ? next(current) : next));
    }
  };

  const wallet = demoEnabled ? demoWallet : realWallet;
  const state = wallet.data;

  useEffect(() => {
    if (!realWallet.loading || demoEnabled || localMode) {
      setLoadingHelpVisible(false);
      return;
    }

    const timeout = window.setTimeout(() => setLoadingHelpVisible(true), 4000);
    return () => window.clearTimeout(timeout);
  }, [demoEnabled, localMode, realWallet.loading]);

  const hasData = Boolean(state.accounts.length || state.debts.length || state.upcoming.length || state.income.length || state.payments.length);
  const sourceLabel = demoEnabled ? "Демо-сценарий" : localMode || wallet.remoteAvailable !== true ? "Локальное зеркало" : "Синхронизировано";
  const freeMoneyValue = money(state.balances.freeMoney);
  const netBalanceValue = money(state.balances.netBalance);
  const accountBalanceValue = money(state.balances.accountBalance);
  const debtBalanceValue = money(Math.abs(Number(state.balances.debtBalance || 0)));
  const leadingAccount = state.accounts[0] ?? null;
  const leadingDebt = state.debts[0] ?? null;
  const firstUpcoming = state.upcoming[0] ?? null;
  const analyticsSeries = useMemo(() => (demoEnabled ? demoTimeseries : createEditorialSeries(state)), [demoEnabled, state]);

  function openScreen(next: MainScreen) {
    startTransition(() => setScreen(next));
  }

  function openWelcome() {
    startTransition(() => setScreen("welcome"));
  }

  function startDemo() {
    setDemoData(demoState);
    setDemoEnabled(true);
    setLocalMode(false);
    startTransition(() => setScreen("home"));
  }

  function stopDemo() {
    setDemoEnabled(false);
    startTransition(() => setScreen("home"));
  }

  const screenContent =
    screen === "welcome" ? (
      <WelcomeScreen
        hasData={hasData}
        onContinue={() => openScreen("home")}
        onOpenDemo={startDemo}
      />
    ) : screen === "detail" ? (
      <DetailScreen accounts={state.accounts} debts={state.debts} upcoming={state.upcoming} onOpenAnalytics={() => openScreen("analytics")} />
    ) : screen === "analytics" ? (
      <AnalyticsScreen
        series={analyticsSeries}
        freeMoney={freeMoneyValue}
        netBalance={netBalanceValue}
        accountBalance={accountBalanceValue}
        debtBalance={debtBalanceValue}
      />
    ) : screen === "settings" ? (
      <SettingsScreen
        demoEnabled={demoEnabled}
        hasData={hasData}
        localMode={localMode}
        sourceLabel={sourceLabel}
        onOpenWelcome={openWelcome}
        onRefresh={() => void realWallet.refresh()}
        onStartDemo={startDemo}
        onStopDemo={stopDemo}
      />
    ) : (
      <HomeScreen
        freeMoney={freeMoneyValue}
        netBalance={netBalanceValue}
        sourceLabel={sourceLabel}
        leadingAccount={leadingAccount}
        leadingDebt={leadingDebt}
        firstUpcoming={firstUpcoming}
        onOpenDetail={() => openScreen("detail")}
        onOpenAnalytics={() => openScreen("analytics")}
        onRefresh={() => void wallet.refresh()}
      />
    );

  return (
    <div className="editorial-root" style={buildTokenVars()}>
      <main className="editorial-app">
        {realWallet.loading && !demoEnabled && !localMode ? (
          <LoadingScreen
            loadingHelpVisible={loadingHelpVisible}
            onContinueLocal={() => {
              setLocalMode(true);
              openScreen("home");
            }}
            onOpenDemo={startDemo}
            onRetry={() => void realWallet.refresh()}
          />
        ) : (
          <>
            {screen === "welcome" ? null : (
              <header className="status-bar">
                <div>
                  <p className="status-bar__caption">PRIVATE OPERATING MODE</p>
                  <p className="status-bar__title">{capitalize(currentMonthLabel)}</p>
                </div>
                <button className="status-bar__action" type="button" onClick={() => void realWallet.refresh()} aria-label="Обновить данные">
                  <RefreshCcw size={18} />
                </button>
              </header>
            )}

            {wallet.error && screen !== "welcome" ? (
              <Card className="system-note system-note--danger">
                <p>Сервер недоступен. Показываю последние локальные данные.</p>
              </Card>
            ) : null}

            {screenContent}

            {screen === "welcome" ? null : (
              <BottomNav
                active={screen as MainScreen}
                items={[
                  { id: "home", label: "Дом", icon: Sparkles },
                  { id: "detail", label: "Контур", icon: WalletCards },
                  { id: "analytics", label: "Аналитика", icon: LineChart },
                  { id: "settings", label: "Режим", icon: Settings2 }
                ]}
                onChange={openScreen}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function WelcomeScreen({
  hasData,
  onContinue,
  onOpenDemo
}: {
  hasData: boolean;
  onContinue: () => void;
  onOpenDemo: () => void;
}) {
  return (
    <section className="screen-view screen-view--welcome">
      <p className="screen-kicker">PERSONAL FINANCE OS</p>
      <Card className="hero-card hero-card--welcome">
        <span className="hero-orbit">
          <ShieldCheck size={18} />
          Спокойный контроль
        </span>
        <h1>Финансы без перегрузки и суеты.</h1>
        <p className="hero-copy">
          Один экран, одна мысль. Здесь легко держать под контролем остатки, обязательства и ближайшие решения.
        </p>
        <div className="hero-actions">
          <Button variant="primary" onClick={onContinue} icon={ArrowRight}>
            {hasData ? "Открыть кабинет" : "Начать спокойно"}
          </Button>
          <Button variant="secondary" onClick={onOpenDemo}>
            Посмотреть концепт
          </Button>
        </div>
      </Card>

      <div className="card-stack">
        <Metric label="Фокус" value="1 экран = 1 мысль" hint="Никаких тяжёлых панелей и перегруженных таблиц." />
        <Metric label="Навигация" value="4 раздела" hint="Только главное: дом, контур, аналитика и режим." />
        <Metric label="Тон" value="Тихая премиальность" hint="Молочный фон, графит, бронзовый акцент и воздух." />
      </div>
    </section>
  );
}

function HomeScreen({
  freeMoney,
  netBalance,
  sourceLabel,
  leadingAccount,
  leadingDebt,
  firstUpcoming,
  onOpenDetail,
  onOpenAnalytics,
  onRefresh
}: {
  freeMoney: string;
  netBalance: string;
  sourceLabel: string;
  leadingAccount: AccountDto | null;
  leadingDebt: DebtDto | null;
  firstUpcoming: UpcomingEventDto | null;
  onOpenDetail: () => void;
  onOpenAnalytics: () => void;
  onRefresh: () => void;
}) {
  return (
    <section className="screen-view">
      <p className="screen-kicker">OPERATING SUMMARY</p>
      <Card className="hero-card">
        <span className="hero-orbit">{sourceLabel}</span>
        <h1>{freeMoney}</h1>
        <p className="hero-copy">Свободный контур на сейчас. Это главная сумма, на которую можно опираться без тревоги.</p>
      </Card>

      <div className="hero-actions hero-actions--compact">
        <Button variant="primary" onClick={onOpenDetail}>
          Открыть контур
        </Button>
        <Button variant="secondary" onClick={onOpenAnalytics}>
          Смотреть аналитику
        </Button>
        <Button variant="ghost" onClick={onRefresh} icon={RefreshCcw}>
          Обновить
        </Button>
      </div>

      <div className="card-stack">
        <Metric label="Чистая позиция" value={netBalance} hint="После учёта долгов и текущих обязательств." tone="accent" />
        <Metric
          label="Главный счёт"
          value={leadingAccount ? `${leadingAccount.name}` : "Пока пусто"}
          hint={leadingAccount ? money(leadingAccount.balance) : "Добавьте первый актив, чтобы увидеть живой контур."}
        />
        <Metric
          label="Ближайший импульс"
          value={firstUpcoming ? `${firstUpcoming.title}` : leadingDebt ? leadingDebt.name : "Нет активного давления"}
          hint={firstUpcoming ? `${shortDate(firstUpcoming.date)} · ${money(firstUpcoming.amount)}` : leadingDebt ? money(Math.abs(Number(leadingDebt.amount))) : "Ритм сейчас спокоен."}
          tone={firstUpcoming ? "danger" : "success"}
        />
      </div>
    </section>
  );
}

function DetailScreen({
  accounts,
  debts,
  upcoming,
  onOpenAnalytics
}: {
  accounts: AccountDto[];
  debts: DebtDto[];
  upcoming: UpcomingEventDto[];
  onOpenAnalytics: () => void;
}) {
  return (
    <section className="screen-view">
      <SectionTitle eyebrow="DETAIL FOCUS" title="Контур активов и обязательств" description="Без перегруженного реестра: только основные опорные точки месяца." />

      <Card>
        <SectionTitle eyebrow="ACCOUNTS" title="Счета" compact />
        {accounts.length ? (
          <div className="line-list">
            {accounts.slice(0, 4).map((account) => (
              <LineItem key={account.id} title={account.name} value={money(account.balance)} icon={<CreditCard size={16} />} />
            ))}
          </div>
        ) : (
          <EmptyState title="Счета пока не добавлены" description="Когда появится первый актив, здесь будет чистый список без лишнего шума." />
        )}
      </Card>

      <Card>
        <SectionTitle eyebrow="PRESSURE" title="Обязательства" compact />
        {debts.length ? (
          <div className="line-list">
            {debts.slice(0, 4).map((debt) => (
              <LineItem key={debt.id} title={debt.name} value={money(Math.abs(Number(debt.amount)))} icon={<Landmark size={16} />} tone="danger" />
            ))}
          </div>
        ) : (
          <EmptyState title="Долговая нагрузка спокойна" description="Если обязательств нет, экран остаётся лёгким и тихим." tone="success" />
        )}
      </Card>

      <Card>
        <SectionTitle eyebrow="NEXT" title="Ближайшие события" compact action={<Button variant="ghost" onClick={onOpenAnalytics}>Глубже</Button>} />
        {upcoming.length ? (
          <div className="line-list">
            {upcoming.slice(0, 3).map((item) => (
              <LineItem key={item.id} title={item.title} value={`${shortDate(item.date)} · ${money(item.amount)}`} icon={<Target size={16} />} />
            ))}
          </div>
        ) : (
          <EmptyState title="График свободен" description="На ближайшее время обязательных событий не зафиксировано." />
        )}
      </Card>
    </section>
  );
}

function AnalyticsScreen({
  series,
  freeMoney,
  netBalance,
  accountBalance,
  debtBalance
}: {
  series: TimeseriesPointDto[];
  freeMoney: string;
  netBalance: string;
  accountBalance: string;
  debtBalance: string;
}) {
  return (
    <section className="screen-view">
      <SectionTitle eyebrow="ANALYTICS" title="Динамика и опорные величины" description="Спокойная аналитика без ярких сигналов. Только линия тренда и несколько смысловых цифр." />

      <Card className="chart-card">
        <div className="chart-header">
          <div>
            <p className="chart-caption">Net balance</p>
            <h2>{netBalance}</h2>
          </div>
          <span className="hero-orbit hero-orbit--soft">
            <Activity size={16} />
            Тренд
          </span>
        </div>
        <div className="chart-stage">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="editorialArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--line-strong)" strokeDasharray="2 7" />
              <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number) => money(value)}
                contentStyle={{
                  borderRadius: 18,
                  border: "1px solid var(--line)",
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: "var(--shadow-soft)",
                  color: "var(--text)"
                }}
              />
              <Area type="monotone" dataKey="netBalance" stroke="var(--accent)" strokeWidth={2.2} fill="url(#editorialArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="card-stack">
        <Metric label="Свободно" value={freeMoney} hint="То, чем можно распоряжаться без потери устойчивости." tone="success" />
        <Metric label="Активы" value={accountBalance} hint="Совокупный объём всех счетов." />
        <Metric label="Давление" value={debtBalance} hint="Текущий объём долговой нагрузки." tone="danger" />
      </div>
    </section>
  );
}

function SettingsScreen({
  demoEnabled,
  hasData,
  localMode,
  sourceLabel,
  onOpenWelcome,
  onRefresh,
  onStartDemo,
  onStopDemo
}: {
  demoEnabled: boolean;
  hasData: boolean;
  localMode: boolean;
  sourceLabel: string;
  onOpenWelcome: () => void;
  onRefresh: () => void;
  onStartDemo: () => void;
  onStopDemo: () => void;
}) {
  return (
    <section className="screen-view">
      <SectionTitle eyebrow="SYSTEM MODE" title="Режим и окружение" description="Экран без лишних настроек: только источник данных, сценарий просмотра и быстрые служебные действия." />

      <div className="card-stack">
        <Metric label="Источник" value={sourceLabel} hint={localMode ? "Данные доступны на этом устройстве даже без сервера." : "Приложение держит актуальный финансовый ритм."} />
        <Metric label="Наполнение" value={hasData ? "Контур заполнен" : "Пока пусто"} hint={hasData ? "Есть данные для анализа и фокуса." : "Можно начать с welcome-экрана или открыть демо."} />
        <Metric label="Демо" value={demoEnabled ? "Включено" : "Выключено"} hint="Подходит для презентации нового интерфейса без риска для реальных данных." tone={demoEnabled ? "accent" : "default"} />
      </div>

      <Card>
        <SectionTitle eyebrow="ACTIONS" title="Быстрые действия" compact />
        <div className="settings-actions">
          <Button variant="primary" onClick={onRefresh} icon={RefreshCcw}>
            Обновить состояние
          </Button>
          <Button variant="secondary" onClick={demoEnabled ? onStopDemo : onStartDemo}>
            {demoEnabled ? "Выключить демо" : "Включить демо"}
          </Button>
          <Button variant="ghost" onClick={onOpenWelcome}>
            Вернуться к приветствию
          </Button>
        </div>
      </Card>
    </section>
  );
}

function LoadingScreen({
  loadingHelpVisible,
  onContinueLocal,
  onOpenDemo,
  onRetry
}: {
  loadingHelpVisible: boolean;
  onContinueLocal: () => void;
  onOpenDemo: () => void;
  onRetry: () => void;
}) {
  return (
    <section className="screen-view screen-view--welcome">
      <p className="screen-kicker">CONNECTING</p>
      <Card className="hero-card hero-card--welcome">
        <span className="hero-orbit">
          <Activity size={18} />
          Соединение
        </span>
        <h1>Подключаю ваш финансовый контур.</h1>
        <p className="hero-copy">Проверяю сохранённые данные и соединение с Telegram. Интерфейс откроется в тихом режиме без лишней индикации.</p>

        {loadingHelpVisible ? (
          <div className="hero-actions hero-actions--stack">
            <Button variant="primary" onClick={onContinueLocal}>
              Продолжить локально
            </Button>
            <Button variant="secondary" onClick={onOpenDemo}>
              Открыть демо
            </Button>
            <Button variant="ghost" onClick={onRetry}>
              Повторить попытку
            </Button>
          </div>
        ) : null}
      </Card>
    </section>
  );
}

function LineItem({
  title,
  value,
  icon,
  tone = "default"
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <div className="line-item">
      <span className={`line-item__icon ${tone === "danger" ? "line-item__icon--danger" : ""}`}>{icon}</span>
      <div className="line-item__body">
        <strong>{title}</strong>
        <span>{value}</span>
      </div>
    </div>
  );
}

function createEditorialSeries(state: DashboardStateDto): TimeseriesPointDto[] {
  const net = Number(state.balances.netBalance || 0);
  const account = Number(state.balances.accountBalance || 0);
  const debt = Number(state.balances.debtBalance || 0);
  const additional = Number(state.balances.additionalExpenses || 0);
  const modifiers = [-0.08, -0.03, 0.01, 0.04, 0.0];
  const labels = ["1н", "2н", "3н", "4н", "5н"];

  return labels.map((label, index) => {
    const netBalance = Math.round(net + net * modifiers[index]);
    return {
      date: label,
      netBalance,
      accountBalance: Math.round(account + account * (modifiers[index] + 0.02)),
      debtBalance: Math.round(debt),
      additionalExpenses: Math.round(additional + 600 * index)
    };
  });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
