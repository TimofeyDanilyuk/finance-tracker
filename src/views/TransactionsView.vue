<template>
  <div class="history scrollable-content">

    <div class="filter-bar">
      <button
        v-for="f in filters"
        :key="f.value"
        class="filter-btn"
        :class="{ active: activeFilter === f.value }"
        @click="activeFilter = f.value"
      >{{ f.label }}</button>
    </div>

    <div class="timeline">
      <div v-for="group in groupedTransactions" :key="group.dateString" class="date-group">
        <div class="group-hdr">
          <span class="group-date">{{ formatGroupDate(group.dateString) }}</span>
          <span v-if="group.dayExpense > 0" class="group-total">−{{ formatCurrency(group.dayExpense) }}</span>
        </div>
        <div class="group-items">
          <div v-for="t in group.items" :key="t.id" class="tx-row">
            <div class="tx-ico" :class="`tx-${t.type}`">
              <AppIcon :name="getIcon(t)" :size="20" />
            </div>
            <div class="tx-info">
              <span class="tx-title">{{ getTitle(t) }}</span>
              <span class="tx-sub">{{ getWallet(t) }}<template v-if="t.note"> · {{ t.note }}</template></span>
            </div>
            <span class="tx-amount" :class="getAmountClass(t)">
              {{ getSign(t) }}{{ formatCurrency(t.amount) }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="groupedTransactions.length === 0" class="empty-state">
        <AppIcon name="history" :size="40" />
        <p>Операций пока нет</p>
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
const activeFilter = ref<'all' | 'expense' | 'income' | 'transfer'>('all')
const filters = [
  { value: 'all',      label: 'Все' },
  { value: 'expense',  label: 'Расходы' },
  { value: 'income',   label: 'Доходы' },
  { value: 'transfer', label: 'Переводы' },
] as const

const fmt = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2 })
const formatCurrency = (v: number) => fmt.format(v)

const formatGroupDate = (d: string) => {
  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (d === today)     return 'Сегодня'
  if (d === yesterday) return 'Вчера'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })
}

const getWallet = (t: Transaction) => {
  const from = store.wallets.find(w => w.id === t.fromWalletId)
  const to   = store.wallets.find(w => w.id === t.toWalletId)
  if (t.type === 'transfer') return `${from?.name || '?'} → ${to?.name || '?'}`
  return t.type === 'income' ? to?.name : from?.name
}
const getIcon  = (t: Transaction) => { if (t.type === 'transfer') return 'transfer'; return store.categories.find(c => c.id === t.categoryId)?.iconName || (t.type === 'income' ? 'salary' : 'wallet') }
const getTitle = (t: Transaction) => { if (t.type === 'transfer') return 'Перевод'; return store.categories.find(c => c.id === t.categoryId)?.name || (t.type === 'income' ? 'Доход' : 'Расход') }
const getSign  = (t: Transaction) => ({ income: '+', expense: '−', transfer: '' }[t.type])
const getAmountClass = (t: Transaction) => ({ income: 'amt-income', expense: 'amt-expense', transfer: 'amt-transfer' }[t.type])

const groupedTransactions = computed(() => {
  const filtered = store.transactions.filter(t => activeFilter.value === 'all' || t.type === activeFilter.value)
  const sorted   = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const groups: { dateString: string; items: Transaction[]; dayExpense: number }[] = []
  sorted.forEach(tx => {
    const key = tx.date.slice(0, 10)
    let g = groups.find(g => g.dateString === key)
    if (!g) { g = { dateString: key, items: [], dayExpense: 0 }; groups.push(g) }
    g.items.push(tx)
    if (tx.type === 'expense') g.dayExpense += tx.amount
  })
  return groups
})
</script>

<style scoped>
.history { padding: 16px 16px calc(var(--tab-h) + 16px); }

.filter-bar {
  display: flex;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 3px;
  margin-bottom: 20px;
}
.filter-btn {
  flex: 1;
  background: transparent;
  color: var(--text-3);
  font-size: 12px;
  font-weight: 700;
  padding: 9px 2px;
  border-radius: 10px;
  transition: background .15s, color .15s;
  white-space: nowrap;
}
.filter-btn.active { background: var(--bg-elevated); color: var(--text-1); }

.timeline { display: flex; flex-direction: column; gap: 22px; }

.date-group { display: flex; flex-direction: column; gap: 8px; }

.group-hdr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}
.group-date  { font-size: 13px; font-weight: 700; color: var(--text-3); text-transform: capitalize; }
.group-total { font-size: 12px; font-weight: 600; color: var(--text-3); }

.group-items {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.tx-row {
  display: flex;
  align-items: center;
  padding: 13px 16px;
  gap: 12px;
  position: relative;
  transition: background .15s;
}
.tx-row:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 68px;
  right: 16px;
  height: 0.5px;
  background: var(--border);
}

.tx-ico {
  width: 40px;
  height: 40px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.tx-expense  { background: var(--bg-elevated); color: var(--blue); }
.tx-income   { background: var(--green-dim);   color: var(--green); }
.tx-transfer { background: var(--bg-elevated); color: var(--text-2); }

.tx-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.tx-title { font-size: 15px; font-weight: 600; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tx-sub   { font-size: 12px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.tx-amount { font-size: 15px; font-weight: 700; flex-shrink: 0; margin-left: 8px; }
.amt-income   { color: var(--green); }
.amt-expense  { color: var(--text-1); }
.amt-transfer { color: var(--text-3); }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 16px; color: var(--text-3); }
</style>