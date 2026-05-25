export interface Wallet {
  id: string;
  name: string;
  isArchived: boolean;
}

export interface Category {
  id: string;
  type: 'income' | 'expense'; // 'income' — доход, 'expense' — расход
  name: string;
  iconName: string; // Имя SVG-иконки из нашего будущего каталога
  monthlyLimit: number | null; // Лимит на месяц (null — если нет лимита)
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number; // Всегда положительное число
  fromWalletId: string; // Используется для 'expense' и 'transfer'
  toWalletId: string;   // Используется для 'income' и 'transfer'
  categoryId: string | null; // null только для переводов ('transfer')
  date: string;         // Строка в формате YYYY-MM-DD
  note: string;         // Комментарий (пометка) к платежу
  createdAt: string;    // ISO-штамп времени для точной сортировки внутри дня
}

export interface AppState {
  version: string;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  ui?: {
    isAnyModalOpen: boolean;
  };
}