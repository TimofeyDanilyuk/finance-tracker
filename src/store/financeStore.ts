import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import type { AppState, Wallet, Category, Transaction } from '../domain/types'

const LOCAL_STORAGE_KEY = 'bair_erp_finance_state'
const CURRENT_VERSION = '1.0.0'

// Дефолтные данные на русском языке для первого запуска
const generateDefaultState = (): AppState => {
  const defaultWallets: Wallet[] = [
    { id: uuidv4(), name: 'Наличные', isArchived: false },
    { id: uuidv4(), name: 'Т-Банк', isArchived: false }
  ]

  const defaultCategories: Category[] = [
    // Доходы
    { id: uuidv4(), type: 'income', name: 'Зарплата', iconName: 'salary', monthlyLimit: null },
    { id: uuidv4(), type: 'income', name: 'Переводы', iconName: 'arrow-down', monthlyLimit: null },
    // Расходы
    { id: uuidv4(), type: 'expense', name: 'Продукты', iconName: 'cart', monthlyLimit: null },
    { id: uuidv4(), type: 'expense', name: 'Транспорт', iconName: 'bus', monthlyLimit: null },
    { id: uuidv4(), type: 'expense', name: 'Кафе', iconName: 'coffee', monthlyLimit: null },
    { id: uuidv4(), type: 'expense', name: 'Жилье', iconName: 'home', monthlyLimit: null },
    { id: uuidv4(), type: 'expense', name: 'Развлечения', iconName: 'smile', monthlyLimit: null }
  ]

  return {
    version: CURRENT_VERSION,
    wallets: defaultWallets,
    categories: defaultCategories,
    transactions: [],
    ui: {
      isAnyModalOpen: false
    }
  }
}

export const useFinanceStore = defineStore('finance', {
  state: (): AppState => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!saved) return generateDefaultState()
    
    try {
      const parsed = JSON.parse(saved) as AppState
      // Базовая проверка версии (на будущее)
      if (!parsed.version) return generateDefaultState()
      // Обеспечиваем наличие ui
      if (!parsed.ui) {
        parsed.ui = { isAnyModalOpen: false }
      }
      return parsed
    } catch (e) {
      console.error('Ошибка загрузки данных из localStorage, создаем чистый стейт', e)
      return generateDefaultState()
    }
  },

  getters: {
    // Динамический расчет баланса для каждого кошелька
    walletBalances: (state) => {
      const balances: Record<string, number> = {}
      
      // Инициализируем нулями
      state.wallets.forEach(w => { balances[w.id] = 0 })

      // Просчитываем цепочку транзакций
      state.transactions.forEach(t => {
        if (t.type === 'income') {
          if (balances[t.toWalletId] !== undefined) balances[t.toWalletId] += t.amount
        } else if (t.type === 'expense') {
          if (balances[t.fromWalletId] !== undefined) balances[t.fromWalletId] -= t.amount
        } else if (t.type === 'transfer') {
          if (balances[t.fromWalletId] !== undefined) balances[t.fromWalletId] -= t.amount
          if (balances[t.toWalletId] !== undefined) balances[t.toWalletId] += t.amount
        }
      })

      return balances
    },

    // Динамический общий баланс (только активные кошельки)
    totalBalance(): number {
      return this.wallets
        .filter(w => !w.isArchived)
        .reduce((sum, w) => sum + (this.walletBalances[w.id] || 0), 0)
    },

    // Флаг открытия любой модалки
    isAnyModalOpen(): boolean {
      return this.ui?.isAnyModalOpen ?? false
    }
  },

  actions: {
    saveToLocalStorage() {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.$state))
    },

    // --- УПРАВЛЕНИЕ UI (МОДАЛКИ) ---
    openModal() {
      if (!this.ui) this.ui = { isAnyModalOpen: false }
      this.ui.isAnyModalOpen = true
    },
    closeModal() {
      if (!this.ui) this.ui = { isAnyModalOpen: false }
      this.ui.isAnyModalOpen = false
    },

    // --- УПРАВЛЕНИЕ ТРАНЗАКЦИЯМИ ---
    addTransaction(payload: Omit<Transaction, 'id' | 'createdAt'>) {
      const newTransaction: Transaction = {
        ...payload,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      }
      this.transactions.push(newTransaction)
      this.saveToLocalStorage()
    },

    editTransaction(id: string, updated: Partial<Transaction>) {
      const idx = this.transactions.findIndex(t => t.id === id)
      if (idx !== -1) {
        this.transactions[idx] = { ...this.transactions[idx], ...updated }
        this.saveToLocalStorage()
      }
    },

    deleteTransaction(id: string) {
      this.transactions = this.transactions.filter(t => t.id !== id)
      this.saveToLocalStorage()
    },

    // --- УПРАВЛЕНИЕ КОШЕЛЬКАМИ ---
    addWallet(name: string) {
      this.wallets.push({ id: uuidv4(), name, isArchived: false })
      this.saveToLocalStorage()
    },

    editWallet(id: string, name: string, isArchived: boolean) {
      const wallet = this.wallets.find(w => w.id === id)
      if (wallet) {
        wallet.name = name
        wallet.isArchived = isArchived
        this.saveToLocalStorage()
      }
    },

    // --- УПРАВЛЕНИЕ КАТЕГОРИЯМИ ---
    addCategory(payload: Omit<Category, 'id'>) {
      this.categories.push({ id: uuidv4(), ...payload })
      this.saveToLocalStorage()
    },

    editCategory(id: string, updated: Partial<Category>) {
      const category = this.categories.find(c => c.id === id)
      if (category) {
        Object.assign(category, updated)
        this.saveToLocalStorage()
      }
    },

    deleteCategory(id: string) {
      this.categories = this.categories.filter(c => c.id !== id)
      // Очищаем категорию у транзакций, которые к ней относились
      this.transactions.forEach(t => {
        if (t.categoryId === id) t.categoryId = null
      })
      this.saveToLocalStorage()
    },

    // --- ИМПОРТ / ЭКСПОРТ (ДАННЫЕ) ---
    exportData() {
      const dataStr = JSON.stringify(this.$state, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const exportFileDefaultName = `wallet_backup_${date}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    },

    importData(jsonString: string): { success: boolean; error?: string } {
      try {
        const parsed = JSON.parse(jsonString)
        
        // Валидация структуры на верхнем уровне
        if (!parsed.wallets || !parsed.categories || !parsed.transactions) {
          return { success: false, error: 'Неверная структура файла. Отсутствуют обязательные разделы.' }
        }

        this.wallets = parsed.wallets
        this.categories = parsed.categories
        this.transactions = parsed.transactions
        if (parsed.version) this.version = parsed.version

        this.saveToLocalStorage()
        return { success: true }
      } catch (e) {
        return { success: false, error: 'Файл не является корректным JSON' }
      }
    }
  }
})