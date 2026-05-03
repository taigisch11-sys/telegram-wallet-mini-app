import { ChevronLeft, Delete, Plus, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { money } from "../../lib/format";

type AmountTone = "action" | "positive" | "danger" | "warning" | "neutral";

type AmountInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  tone?: AmountTone;
  compact?: boolean;
  allowNegative?: boolean;
  applyLabel?: string;
  quickValues?: number[];
  showLabel?: boolean;
  className?: string;
};

const defaultQuickValues = [500, 1000, 5000, 10000];
const keypadRows = [
  ["7", "8", "9", "+"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "×"],
  [",", "0", "000", "÷"]
];

export function AmountInput({
  label,
  value,
  onChange,
  helper,
  tone = "action",
  compact = false,
  allowNegative = false,
  applyLabel = "Готово",
  quickValues = defaultQuickValues,
  showLabel = true,
  className = ""
}: AmountInputProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const numericValue = normalizeMoney(value);
  const displayValue = money(numericValue);
  const displayDraft = draft.trim() ? draft : "0";
  const resultPreview = useMemo(() => formatPreview(evaluateExpression(displayDraft)), [displayDraft]);

  function openCalculator() {
    setDraft(Number(numericValue) === 0 ? "" : trimMoney(numericValue));
    setError("");
    setOpen(true);
  }

  function appendToken(token: string) {
    setError("");
    setDraft((current) => appendToDraft(current, token));
  }

  function addQuickValue(amount: number) {
    setError("");
    setDraft((current) => trimMoney((evaluateExpression(current || "0") + amount).toFixed(2)));
  }

  function calculate() {
    const result = evaluateExpression(displayDraft);
    setDraft(trimMoney(result.toFixed(2)));
    setError("");
  }

  function backspace() {
    setError("");
    setDraft((current) => current.slice(0, -1).trimEnd());
  }

  function clear() {
    setError("");
    setDraft("");
  }

  function apply() {
    const result = evaluateExpression(displayDraft);
    if (!Number.isFinite(result)) {
      setError("Проверьте выражение");
      return;
    }

    const nextValue = allowNegative ? result : Math.abs(result);
    onChange(nextValue.toFixed(2));
    setOpen(false);
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className={`${showLabel ? "block" : "sr-only"} text-xs font-bold text-slate-400`}>
          {label}
        </label>
        {showLabel && Number(numericValue) !== 0 ? (
          <button className="text-[11px] font-extrabold text-slate-500" type="button" onClick={() => onChange("0.00")}>
            Сбросить
          </button>
        ) : null}
      </div>
      <input
        id={id}
        aria-label={label}
        className="sr-only"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(normalizeMoney(event.target.value))}
      />
      <button
        className={`mt-1 flex w-full items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-[#1b1b1f] text-left outline-none transition focus:border-action ${
          compact ? "px-3 py-2" : "px-4 py-3"
        }`}
        type="button"
        aria-label={`${label}: ${displayValue}`}
        onClick={openCalculator}
      >
        <span className="min-w-0">
          <span className={`block font-extrabold tracking-[-0.03em] ${compact ? "text-[17px]" : "text-[22px]"} ${toneTextClass(tone)}`}>{displayValue}</span>
          {helper ? <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-slate-500">{helper}</span> : null}
        </span>
        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-action/15 text-action">
          <Plus size={18} strokeWidth={3} />
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/55 px-3" role="presentation">
          <section
            role="dialog"
            aria-label="Калькулятор"
            aria-modal="true"
            className="mx-auto mb-[calc(0.75rem+env(safe-area-inset-bottom))] w-full max-w-md rounded-t-[32px] border border-white/10 bg-[#1d1d20] p-4 shadow-[0_-24px_70px_rgba(0,0,0,0.62)]"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[24px] font-extrabold text-white">Калькулятор</h2>
                <p className="mt-1 text-sm font-semibold text-slate-400">{label}</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white" type="button" aria-label="Закрыть калькулятор" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="rounded-[24px] bg-[#2b2b2f] p-3">
              <div className="min-h-[58px] rounded-[18px] bg-[#161619] px-4 py-3 text-right">
                <p className="break-words text-[32px] font-extrabold leading-tight tracking-[-0.05em] text-white">{displayDraft}</p>
                <p className={`mt-1 text-sm font-bold ${toneTextClass(tone)}`}>{resultPreview}</p>
              </div>
              {error ? <p className="mt-2 rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-bold text-danger">{error}</p> : null}
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {quickValues.map((amount) => (
                <button key={amount} className="min-h-10 rounded-[16px] bg-action/15 px-2 text-sm font-extrabold text-action" type="button" onClick={() => addQuickValue(amount)}>
                  +{formatPlain(amount)}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {keypadRows.flat().map((key) => (
                <button
                  key={key}
                  className={`min-h-[58px] rounded-[18px] text-[24px] font-extrabold ${isOperator(key) ? "bg-action/15 text-action" : "bg-[#34343a] text-white"}`}
                  type="button"
                  aria-label={key}
                  onClick={() => appendToken(key)}
                >
                  {key}
                </button>
              ))}
              <button className="min-h-[56px] rounded-[18px] bg-danger/10 text-[20px] font-extrabold text-danger" type="button" onClick={clear}>
                C
              </button>
              <button className="min-h-[56px] rounded-[18px] bg-[#34343a] text-white" type="button" aria-label="Стереть цифру" onClick={backspace}>
                <Delete className="mx-auto" size={23} />
              </button>
              <button className="min-h-[56px] rounded-[18px] bg-action/15 text-[24px] font-extrabold text-action" type="button" aria-label="=" onClick={calculate}>
                =
              </button>
              <button className="min-h-[56px] rounded-[18px] bg-[#34343a] text-white" type="button" aria-label="Вернуться" onClick={() => setOpen(false)}>
                <ChevronLeft className="mx-auto" size={24} />
              </button>
            </div>

            <button className={`mt-3 flex min-h-[58px] w-full items-center justify-center rounded-[22px] text-[18px] font-extrabold text-white ${toneButtonClass(tone)}`} type="button" onClick={apply}>
              {applyLabel}
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function appendToDraft(current: string, token: string) {
  const normalizedToken = token === "," ? "." : token === "×" ? "*" : token === "÷" ? "/" : token;
  const trimmed = current.trim();

  if (isOperator(normalizedToken)) {
    if (!trimmed) return "0 " + normalizedToken + " ";
    if (isOperator(trimmed.slice(-1))) return trimmed.slice(0, -1) + normalizedToken + " ";
    return `${trimmed} ${normalizedToken} `;
  }

  if (normalizedToken === ".") {
    const lastNumber = trimmed.split(/[+\-*/]/).pop() ?? "";
    if (lastNumber.includes(".")) return current;
    return trimmed ? `${trimmed}.` : "0.";
  }

  if (!trimmed || trimmed === "0") return normalizedToken === "000" ? "0" : normalizedToken;
  return `${current}${normalizedToken}`;
}

function evaluateExpression(value: string) {
  const sanitized = value.replace(/,/g, ".").replace(/×/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");
  if (!sanitized || !/^[\d.+\-*/]+$/.test(sanitized)) return 0;

  const expression = sanitized.replace(/[+\-*/.]+$/, "");
  const tokens = expression.match(/(?:\d+(?:\.\d*)?|\.\d+|[+\-*/])/g);
  if (!tokens) return 0;

  const values: number[] = [];
  const operators: string[] = [];
  let expectsNumber = true;

  for (const token of tokens) {
    if (isOperator(token)) {
      if (expectsNumber) {
        if (token !== "-") continue;
        values.push(0);
      }

      while (operators.length > 0 && precedence(operators[operators.length - 1]) >= precedence(token)) {
        applyOperator(values, operators.pop()!);
      }
      operators.push(token);
      expectsNumber = true;
      continue;
    }

    const parsed = Number(token);
    if (!Number.isFinite(parsed)) return 0;
    values.push(parsed);
    expectsNumber = false;
  }

  while (operators.length > 0) applyOperator(values, operators.pop()!);
  const result = values[0] ?? 0;
  return Number.isFinite(result) ? result : 0;
}

function normalizeMoney(value: string) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
}

function trimMoney(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(parsed).replace(/\s/g, "");
}

function formatPreview(value: number) {
  return money(Number.isFinite(value) ? value.toFixed(2) : "0.00");
}

function formatPlain(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}

function isOperator(value: string) {
  return ["+", "-", "*", "/", "×", "÷"].includes(value);
}

function precedence(operator: string) {
  return operator === "*" || operator === "/" ? 2 : 1;
}

function applyOperator(values: number[], operator: string) {
  const right = values.pop() ?? 0;
  const left = values.pop() ?? 0;
  if (operator === "+") values.push(left + right);
  if (operator === "-") values.push(left - right);
  if (operator === "*") values.push(left * right);
  if (operator === "/") values.push(right === 0 ? 0 : left / right);
}

function toneTextClass(tone: AmountTone) {
  if (tone === "positive") return "text-positive";
  if (tone === "danger") return "text-danger";
  if (tone === "warning") return "text-amber";
  if (tone === "neutral") return "text-white";
  return "text-action";
}

function toneButtonClass(tone: AmountTone) {
  if (tone === "positive") return "bg-positive text-[#07160f]";
  if (tone === "danger") return "bg-danger";
  if (tone === "warning") return "bg-amber text-[#1b1b1d]";
  return "bg-action";
}
