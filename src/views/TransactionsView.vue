<template>
  <div class="history-view scrollable-content">
    <h2 class="page-title">История</h2>

    <div class="filter-segments">
      <button 
        v-for="type in filterTypes" 
        :key="type.value"
        :class="['segment-btn', { active: activeFilter === type.value }]"
        @click="activeFilter = type.value"
      >
        {{ type.label }}
      </button>
    </div>

    <div class="transactions-timeline">
      
      <div 
        v-for="group in groupedTransactions" 
        :key="group.dateString" 
        class="date-group"
      >
        <div class="date-group-header">
          <span class="group-date">{{ formatGroupDate(group.dateString) }}</span>
          <span v-if="group.dayExpense > 0" class="group-total">
            -{{ formatCurrency(group.dayExpense) }}
          </span>
        </div>

        <div class="group-items">
          <div 
            v-for="t in group.items" 
            :key="t.id" 
            class="transaction-item"
          >
            <div class="tx-icon-circle" :class="`tx-type-${t.type}`">
              <AppIcon :name="getTransactionIcon(t)" :size="22" />
            </div>

            <div class="tx-info">
              <div class="tx-main-row">
                <span class="tx-title">{{ getTransactionTitle(t) }}</span>
              </div>
              <div class="tx-sub-row">
                <span class="tx-wallet">{{ getWalletName(t) }}</span>
                <span v-if="t.note" class="tx-dot">•</span>
                <span v-if="t.note" class="tx-note">{{ t.note }}</span>
              </div>
            </div>

            <div class="tx-amount-block">
              <span :class="['tx-amount', getAmountClass(t)]">
                {{ getAmountSign(t) }}{{ formatCurrency(t.amount) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="groupedTransactions.length === 0" class="empty-state">
        <AppIcon name="transfer" :size="40" class="empty-icon" />
        <p>Операций пока нет или они отфильтрованы</p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '@/store/financeStore'
import AppIcon from '@/components/AppIcon.vue'
import type { Transaction } from '@/domain/types'

const store = useFinanceStore()

// Типы фильтров
const activeFilter = ref<'all' | 'expense' | 'income' | 'transfer'>('all')
const filterTypes = [
  { value: 'all', label: 'Все' },
  { value: 'expense', label: 'Расходы' },
  { value: 'income', label: 'Доходы' },
  { value: 'transfer', label: 'Переводы' }
] as const

// Хелперы форматирования денег
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

// Красивый вывод дат групп (Сегодня, Вчера или просто дата)
const formatGroupDate = (dateStr: string) => {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  if (dateStr === today) return 'Сегодня'
  if (dateStr === yesterday) return 'Вчера'

  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'short'
  })
}

// Получение названия кошелька/кошельков
const getWalletName = (t: Transaction) => {
  const fromW = store.wallets.find(w => w.id === t.fromWalletId)
  const toW = store.wallets.find(w => w.id === t.toWalletId)

  if (t.type === 'transfer') {
    return `${fromW?.name || '???'} → ${toW?.name || '???'}`
  }
  return t.type === 'income' ? toW?.name : fromW?.name
}

// Получение иконки для транзакции
const getTransactionIcon = (t: Transaction) => {
  if (t.type === 'transfer') return 'transfer'
  const cat = store.categories.find(c => c.id === t.categoryId)
  return cat?.iconName || (t.type === 'income' ? 'salary' : 'wallet')
}

// Получение заголовка (Имя категории или тип операции)
const getTransactionTitle = (t: Transaction) => {
  if (t.type === 'transfer') return 'Перевод'
  const cat = store.categories.find(c => c.id === t.categoryId)
  return cat?.name || (t.type === 'income' ? 'Доход' : 'Расход')
}

// Знак перед суммой
const getAmountSign = (t: Transaction) => {
  if (t.type === 'income') return '+'
  if (t.type === 'expense') return '-'
  return ''
}

// Класс цвета для суммы
const getAmountClass = (t: Transaction) => {
  if (t.type === 'income') return 'text-income'
  if (t.type === 'transfer') return 'text-transfer'
  return 'text-expense'
}

// Группировка транзакций по дням с учетом фильтра
const groupedTransactions = computed(() => {
  // 1. Фильтруем базовый массив
  const filtered = store.transactions.filter(t => {
    if (activeFilter.value === 'all') return true
    return t.type === activeFilter.value
  })

  // 2. Сортируем по реальному времени создания/дате (сначала новые)
  const sorted = [...filtered].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime() || 
           new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  // 3. Группируем в структуру [{ dateString, items, dayExpense }]
  const groups: { dateString: string; items: Transaction[]; dayExpense: number }[] = []

  sorted.forEach(tx => {
    const dStr = tx.date.slice(0, 10) // Отрезаем YYYY-MM-DD
    let group = groups.find(g => g.dateString === dStr)

    if (!group) {
      group = { dateString: dStr, items: [], dayExpense: 0 }
      groups.push(group)
    }

    group.items.push(tx)

    // Считаем сумму расходов за этот день (только для типа expense)
    if (tx.type === 'expense') {
      group.dayExpense += tx.amount
    }
  })

  return groups
})
</script>

<style scoped>
.history-view {
  padding: 16px;
  padding-bottom: 90px;
  box-sizing: border-box;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
}

/* iOS Segmented Control */
.filter-segments {
  display: flex;
  background-color: #1c1c1e;
  padding: 2px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.segment-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: #8e8e93;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 2px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.segment-btn.active {
  background-color: #2c2c2e;
  color: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

/* Группировка по дням */
.transactions-timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.date-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.group-date {
  font-size: 14px;
  font-weight: 600;
  color: #8e8e93;
  text-transform: capitalize;
}

.group-total {
  font-size: 13px;
  font-weight: 500;
  color: #8e8e93;
}

/* Элемент транзакции */
.group-items {
  background-color: #1c1c1e;
  border-radius: 14px;
  padding: 4px 0;
  display: flex;
  flex-direction: column;
  list-style: none !important;
}

.transaction-item {
  display: flex !important;
  align-items: center !important;
  padding: 12px 16px;
  position: relative;
  list-style: none !important;
}

/* Красивый разделитель между строками внутри одной группы */
.transaction-item:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 16px;
  left: 68px; /* Выровнен по тексту, не заходит под круг */
  height: 0.5px;
  background-color: #2c2c2e;
}

/* Иконки в кругах (с защитой от кривизны ПК) */
.tx-icon-circle {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-right: 12px !important;
  flex-shrink: 0;
}

/* Цвета кругов в зависимости от типа транзакции */
.tx-type-expense { background-color: #2c2c2e !important; color: var(--accent-blue); }
.tx-type-income { background-color: rgba(52, 199, 89, 0.1) !important; color: var(--accent-green); }
.tx-type-transfer { background-color: rgba(255, 255, 255, 0.05) !important; color: #ffffff; }

/* Текстовый блок */
.tx-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0; /* Важно для сжатия длинных текстов */
}

.tx-main-row {
  display: flex;
  align-items: center;
}

.tx-title {
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-sub-row {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #8e8e93;
}

.tx-wallet {
  white-space: nowrap;
}

.tx-dot {
  margin: 0 4px;
}

.tx-note {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Блок суммы */
.tx-amount-block {
  margin-left: 12px;
  flex-shrink: 0;
  text-align: right;
}

.tx-amount {
  font-size: 16px;
  font-weight: 600;
}

.text-expense { color: #ffffff; }
.text-income { color: var(--accent-green); }
.text-transfer { color: #8e8e93; }

/* Пустое состояние */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 16px;
  color: #8e8e93;
}

.empty-icon {
  color: #2c2c2e;
  margin-bottom: 12px;
}
</style>