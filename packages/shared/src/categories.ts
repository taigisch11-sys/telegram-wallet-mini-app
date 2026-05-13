import { CategoryType } from "./enums";
import type { CategoryType as CategoryTypeValue } from "./enums";

export type DefaultCategorySeed = {
  name: string;
  type: CategoryTypeValue;
  color: string;
  icon: string;
  isDefault: true;
};

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  { name: "Доход", type: CategoryType.income, color: "#32d583", icon: "arrow-down-left", isDefault: true },
  { name: "Обязательные", type: CategoryType.expense, color: "#5b8cff", icon: "receipt", isDefault: true },
  { name: "Кредиты", type: CategoryType.expense, color: "#7c6cff", icon: "credit-card", isDefault: true },
  { name: "Еда", type: CategoryType.expense, color: "#ffb84d", icon: "basket", isDefault: true },
  { name: "Дом", type: CategoryType.expense, color: "#4db6ff", icon: "home", isDefault: true },
  { name: "Транспорт", type: CategoryType.expense, color: "#26c6da", icon: "car", isDefault: true },
  { name: "Связь", type: CategoryType.expense, color: "#9aa4ff", icon: "phone", isDefault: true },
  { name: "Здоровье", type: CategoryType.expense, color: "#ff6b8a", icon: "heart", isDefault: true },
  { name: "Другое", type: CategoryType.expense, color: "#9a9aa0", icon: "more-horizontal", isDefault: true },
  { name: "Нераспределено", type: CategoryType.expense, color: "#f59e0b", icon: "blend", isDefault: true }
];

export function defaultCategoryByName(name: string) {
  return DEFAULT_CATEGORIES.find((category) => category.name === name) ?? null;
}
