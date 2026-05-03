import { BarChart3, BookOpen, CheckCircle2, Clock3, FlaskConical, PlayCircle } from "lucide-react";
import type { Screen } from "../app/App";
import { Card } from "../components/common/card";

export const userFunctionChecklist = [
  "Сверка остатков по счетам и долгам",
  "Добавление и удаление счетов",
  "Добавление и удаление долгов",
  "Планирование фиксированных доходов",
  "Планирование обязательных платежей",
  "Отметка дохода как полученного",
  "Отметка платежа как оплаченного",
  "Расчёт свободных денег после плана",
  "Предупреждения о просрочке, задержке дохода и кассовом разрыве",
  "Таймлайн движения финансов",
  "Графики баланса, счетов, долгов и нераспределённых расходов",
  "История операций и корректировок",
  "Локальное хранение данных при недоступном backend"
];

export function MenuScreen({
  demoEnabled,
  learningEnabled,
  onStartDemo,
  onStopDemo,
  onStartLearning,
  onStopLearning,
  onNavigate
}: {
  demoEnabled: boolean;
  learningEnabled: boolean;
  onStartDemo: () => void;
  onStopDemo: () => void;
  onStartLearning: () => void;
  onStopLearning: () => void;
  onNavigate: (screen: Screen) => void;
}) {
  return (
    <div className="space-y-3">
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="wallet-token h-12 w-12 bg-[#2d7dff]">
            <FlaskConical size={23} />
          </div>
          <div>
            <h2 className="text-[24px] font-extrabold tracking-[-0.04em]">Меню</h2>
            <p className="text-sm font-semibold text-slate-400">Демо, обучение и контроль функций</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ModeButton title="Демо-режим" text="Пример заполненного кошелька" icon={FlaskConical} active={demoEnabled} action={demoEnabled ? "Выключить демо" : "Включить демо"} onClick={demoEnabled ? onStopDemo : onStartDemo} />
          <ModeButton title="Режим обучения" text="Пошаговый маршрут новичка" icon={BookOpen} active={learningEnabled} action={learningEnabled ? "Выключить обучение" : "Включить обучение"} onClick={learningEnabled ? onStopLearning : onStartLearning} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-extrabold">Быстрые переходы</h2>
        <div className="grid grid-cols-3 gap-2">
          <QuickButton label="История" icon={Clock3} onClick={() => onNavigate("history")} />
          <QuickButton label="Графики" icon={BarChart3} onClick={() => onNavigate("charts")} />
          <QuickButton label="Финансы" icon={PlayCircle} onClick={() => onNavigate("wallet")} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-extrabold">Чек-лист функций</h2>
        <div className="space-y-2">
          {userFunctionChecklist.map((item) => (
            <div key={item} className="flex items-start gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
              <CheckCircle2 className="mt-0.5 flex-none text-[#32d178]" size={17} />
              <p className="text-sm font-semibold leading-5 text-slate-200">{item}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ModeButton({
  title,
  text,
  icon: Icon,
  active,
  action,
  onClick
}: {
  title: string;
  text: string;
  icon: typeof FlaskConical;
  active: boolean;
  action: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`rounded-[24px] border p-3 text-left transition ${active ? "border-[#32d178]/60 bg-[#123926]" : "border-white/10 bg-[#202024]"}`} onClick={onClick}>
      <Icon className={active ? "text-[#32d178]" : "text-[#55a7ff]"} size={24} />
      <p className="mt-3 text-base font-extrabold text-white">{title}</p>
      <p className="mt-1 min-h-[38px] text-xs font-semibold leading-4 text-slate-400">{text}</p>
      <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${active ? "bg-[#32d178] text-[#07160f]" : "bg-white text-[#1b1b1d]"}`}>{action}</span>
    </button>
  );
}

function QuickButton({ label, icon: Icon, onClick }: { label: string; icon: typeof Clock3; onClick: () => void }) {
  return (
    <button type="button" className="grid min-h-[74px] place-items-center rounded-[20px] bg-[#2b2b2f] text-sm font-extrabold text-white" onClick={onClick}>
      <Icon className="text-[#55a7ff]" size={22} />
      {label}
    </button>
  );
}
