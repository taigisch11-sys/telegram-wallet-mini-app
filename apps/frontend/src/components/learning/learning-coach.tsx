import { ArrowLeft, ArrowRight, CheckCircle2, X } from "lucide-react";
import type { Screen } from "../../app/App";

const steps: { title: string; text: string; action: string; target: Screen }[] = [
  {
    title: "Начните со сверки",
    text: "Введите реальные остатки по картам, наличным и долгам. Это главная точка правды.",
    action: "Перейти к счетам",
    target: "accounts"
  },
  {
    title: "Зафиксируйте план",
    text: "Добавьте обязательные платежи и ожидаемые доходы. Каждая позиция появится в таймлайне только при исполнении.",
    action: "Открыть план",
    target: "plan"
  },
  {
    title: "Отмечайте исполнение",
    text: "Не вводите каждую покупку. Просто отмечайте выполненные доходы и платежи, когда они случились.",
    action: "Проверить план",
    target: "plan"
  },
  {
    title: "Смотрите свободные деньги",
    text: "Главная сумма показывает, сколько можно тратить после будущих обязательных платежей.",
    action: "На главный экран",
    target: "wallet"
  },
  {
    title: "Разбирайте динамику",
    text: "Графики и история покажут, где был скачок, а где расходы равномерно распределились между сверками.",
    action: "Открыть графики",
    target: "charts"
  }
];

export function LearningCoach({
  step,
  onStep,
  onNavigate,
  onClose
}: {
  step: number;
  onStep: (step: number) => void;
  onNavigate: (screen: Screen) => void;
  onClose: () => void;
}) {
  const current = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;
  const canGoBack = step > 0;

  function go() {
    onNavigate(current.target);
    onStep(Math.min(step + 1, steps.length - 1));
  }

  function back() {
    const previousStep = Math.max(step - 1, 0);
    onStep(previousStep);
    onNavigate(steps[previousStep].target);
  }

  return (
    <section className="mb-4 rounded-[28px] border border-action/35 bg-actionSoft/70 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-action">Обучение включено</p>
          <h2 className="mt-1 text-xl font-extrabold text-white">{current.title}</h2>
        </div>
        <button type="button" aria-label="Выключить обучение" className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white" onClick={onClose}>
          <X size={17} />
        </button>
      </div>
      <p className="text-sm font-semibold leading-5 text-[#c9ddff]">{current.text}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-white">
          <CheckCircle2 size={18} className="text-positive" />
          Шаг {step + 1} из {steps.length}
        </div>
        <div className="flex items-center gap-2">
          {canGoBack ? (
            <button type="button" className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-sm font-extrabold text-white" onClick={back}>
              <ArrowLeft size={16} />
              Назад
            </button>
          ) : null}
          <button type="button" className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#10213d]" onClick={go}>
            {isLast ? "Повторить маршрут" : current.action}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
