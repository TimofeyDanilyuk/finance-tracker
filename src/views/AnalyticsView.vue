<template>
  <div class="analytics scrollable-content">

    <div class="period-bar">
      <button
        v-for="p in periods"
        :key="p.value"
        class="period-btn"
        :class="{ active: currentPeriod === p.value }"
        @click="currentPeriod = p.value"
      >{{ p.label }}</button>
    </div>

    <div class="summary-row">
      <div class="sum-card sum-income">
        <span class="sum-label">Доходы</span>
        <span class="sum-val income">+{{ formatCurrency(totalIncome) }}</span>
      </div>
      <div class="sum-card sum-expense">
        <span class="sum-label">Расходы</span>
        <span class="sum-val expense">−{{ formatCurrency(totalExpense) }}</span>
      </div>
    </div>

    <div class="insights-row" v-if="totalExpense > 0">
      <div class="insight-pill">
        <span class="insight-label">В день</span>
        <span class="insight-val">{{ formatCurrency(dailyAverage) }}</span>
      </div>
      <div class="insight-pill" v-if="topSingleTransaction">
        <span class="insight-label">Пик</span>
        <span class="insight-val">{{ formatCurrency(topSingleTransaction.amount) }}</span>
      </div>
    </div>

    <!-- Donut Chart -->
    <div class="chart-card" v-if="totalExpense > 0">
      <div class="donut-wrap">
        <svg viewBox="0 0 42 42" class="donut">
          <circle
            v-for="(s, i) in chartSectors"
            :key="i"
            cx="21" cy="21" r="15.9"
            fill="transparent"
            :stroke="s.color"
            stroke-width="4"
            :stroke-dasharray="`${s.percentage} ${100 - s.percentage}`"
            :stroke-dashoffset="s.offset"
          />
        </svg>
        <div class="donut-center">
          <span class="donut-label">Расходы</span>
          <span class="donut-total">{{ formatCurrency(totalExpense) }}</span>
        </div>
      </div>
    </div>

    <!-- Breakdown -->
    <section class="section">
      <h3 class="section-title">По категориям</h3>
      <div class="breakdown-list" v-if="categoryBreakdown.length > 0">
        <div v-for="item in categoryBreakdown" :key="item.id" class="breakdown-item">
          <div class="bd-icon" :style="{ color: item.color, background: item.color + '22' }">
            <AppIcon :name="item.icon" :size="18" />
          </div>
          <div class="bd-info">
            <div class="bd-top">
              <span class="bd-name">{{ item.name }}</span>
              <span class="bd-amount">{{ formatCurrency(item.amount) }}</span>
            </div>
            <div class="bd-bar-bg">
              <div class="bd-bar-fill" :style="{ width: item.percentage + '%', background: item.color }"></div>
            </div>
            <span class="bd-pct">{{ item.percentage }}%</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <AppIcon name="analytics" :size="40" />
        <p>Нет данных за период</p>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '@/store/financeStore'
import AppIcon from '@/components/AppIcon.vue'

const store = useFinanceStore()
const currentPeriod = ref<'month' | 'year'>('month')
const periods = [{ value: 'month', label: 'Месяц' }, { value: 'year', label: 'Год' }] as const
const colorPalette = ['#5d8aff','#34c759','#ff9500','#ff453a','#bf5af2','#5ac8fa','#ffd60a','#ff2d55']
const fmt = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2 })
const formatCurrency = (v: number) => fmt.format(v)

const periodTransactions = computed(() => {
  const now = new Date()
  return store.transactions.filter(t => {
    const d = new Date(t.date)
    return currentPeriod.value === 'year'
      ? d.getFullYear() === now.getFullYear()
      : d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
})

const totalIncome  = computed(() => periodTransactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const totalExpense = computed(() => periodTransactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))

const dailyAverage = computed(() => {
  if (!totalExpense.value) return 0
  const now = new Date()
  const days = currentPeriod.value === 'year'
    ? Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) || 1
    : now.getDate()
  return Math.round(totalExpense.value / days)
})

const topSingleTransaction = computed(() => {
  const expenses = periodTransactions.value.filter(t => t.type === 'expense')
  return expenses.length ? expenses.reduce((m, t) => t.amount > m.amount ? t : m, expenses[0]) : null
})

const categoryBreakdown = computed(() => {
  if (!totalExpense.value) return []
  const map: Record<string, number> = {}
  periodTransactions.value.filter(t => t.type === 'expense').forEach(t => { if (t.categoryId) map[t.categoryId] = (map[t.categoryId] || 0) + t.amount })
  return Object.entries(map).map(([id, amount], i) => {
    const cat = store.categories.find(c => c.id === id)
    return { id, name: cat?.name || 'Разное', icon: cat?.iconName || 'wallet', amount, percentage: Math.round(amount / totalExpense.value * 100), color: colorPalette[i % colorPalette.length] }
  }).sort((a, b) => b.amount - a.amount)
})

const chartSectors = computed(() => {
  let offset = 25
  return categoryBreakdown.value.map(item => {
    const o = offset; offset -= item.percentage
    return { percentage: item.percentage, offset: o, color: item.color }
  })
})
</script>

<style scoped>
.analytics { padding: 16px 16px calc(var(--tab-h) + 16px); }

.period-bar {
  display: flex;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 3px;
  margin-bottom: 16px;
}

.period-btn {
  flex: 1;
  background: transparent;
  color: var(--text-3);
  font-size: 13px;
  font-weight: 700;
  padding: 9px 2px;
  border-radius: 10px;
  transition: background .15s, color .15s;
}
.period-btn.active { background: var(--bg-elevated); color: var(--text-1); }

.summary-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.sum-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sum-label { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }
.sum-val   { font-size: 17px; font-weight: 800; letter-spacing: -0.5px; }
.sum-val.income  { color: var(--green); }
.sum-val.expense { color: var(--text-1); }

.insights-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.insight-pill {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.insight-label { font-size: 10px; font-weight: 700; color: var(--text-3); text-transform: uppercase; }
.insight-val   { font-size: 15px; font-weight: 700; color: var(--text-1); }

/* Donut */
.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.donut-wrap {
  position: relative;
  width: 164px;
  height: 164px;
}

.donut {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.donut-label { font-size: 10px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }
.donut-total { font-size: 17px; font-weight: 800; color: var(--text-1); letter-spacing: -0.5px; }

/* Breakdown */
.section { margin-bottom: 20px; }

.breakdown-list {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 6px 16px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}
.breakdown-item:last-child { border-bottom: none; }

.bd-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bd-info { flex: 1; min-width: 0; }
.bd-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.bd-name   { font-size: 15px; font-weight: 600; color: var(--text-1); }
.bd-amount { font-size: 15px; font-weight: 700; color: var(--text-1); }

.bd-bar-bg { height: 4px; background: var(--bg-elevated); border-radius: 2px; overflow: hidden; margin-bottom: 4px; }
.bd-bar-fill { height: 100%; border-radius: 2px; transition: width .4s; }
.bd-pct { font-size: 11px; color: var(--text-3); }

.empty-state { text-align: center; padding: 40px 16px; color: var(--text-3); display: flex; flex-direction: column; align-items: center; gap: 10px; }
</style>