<template>
  <div class="analytics-view scrollable-content">
    <h2 class="page-title">Аналитика</h2>

    <!-- Переключатель периодов -->
    <div class="period-segments">
      <button 
        v-for="p in periods" 
        :key="p.value"
        :class="['segment-btn', { active: currentPeriod === p.value }]"
        @click="currentPeriod = p.value"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- НОВАЯ СТАТИСТИКА: Карточки Доход / Расход / Дельта -->
    <div class="summary-cards-grid">
      <div class="summary-card income-card">
        <span class="summary-label">Доходы</span>
        <span class="summary-amount text-income">+{{ formatCurrency(totalIncome) }}</span>
      </div>
      <div class="summary-card expense-card">
        <span class="summary-label">Расходы</span>
        <span class="summary-amount text-expense-alt">-{{ formatCurrency(totalExpense) }}</span>
      </div>
    </div>

    <!-- Дополнительные инсайты (Среднее в день и Главная трата) -->
    <div class="insights-block" v-if="totalExpense > 0">
      <div class="insight-row">
        <div class="insight-item">
          <span class="insight-label">В день в среднем</span>
          <span class="insight-value">{{ formatCurrency(dailyAverage) }}</span>
        </div>
        <div class="insight-item" v-if="topSingleTransaction">
          <span class="insight-label">Пиковый расход</span>
          <span class="insight-value truncate" :title="topSingleTransaction.note">
            {{ formatCurrency(topSingleTransaction.amount) }} 
            <small>({{ getTransactionTitle(topSingleTransaction) }})</small>
          </span>
        </div>
      </div>
    </div>

    <!-- Главная карточка с графиком-пончиком -->
    <div class="chart-card" v-if="totalExpense > 0">
      <div class="chart-wrapper">
        <svg viewBox="0 0 42 42" class="donut-chart">
          <circle 
            v-for="(sector, index) in chartSectors" 
            :key="index"
            cx="21" 
            cy="21" 
            r="15.91549430918954" 
            fill="transparent" 
            :stroke="sector.color"
            stroke-width="4.5"
            :stroke-dasharray="`${sector.percentage} ${100 - sector.percentage}`"
            :stroke-dashoffset="sector.offset"
          />
        </svg>
        <div class="chart-inner-text">
          <span class="inner-label">Всего траты</span>
          <span class="inner-amount">{{ formatCurrency(totalExpense) }}</span>
        </div>
      </div>
    </div>

    <!-- Список категорий с полосой прогресса -->
    <section class="breakdown-section">
      <h3 class="sub-title">По категориям</h3>
      <div class="breakdown-list" v-if="categoryBreakdown.length > 0">
        
        <div 
          v-for="item in categoryBreakdown" 
          :key="item.id" 
          class="breakdown-item"
        >
          <div class="breakdown-icon-circle" :style="{ color: item.color }">
            <AppIcon :name="item.icon" :size="20" />
          </div>

          <div class="breakdown-info">
            <div class="breakdown-row">
              <span class="cat-name">{{ item.name }}</span>
              <span class="cat-amount">{{ formatCurrency(item.amount) }}</span>
            </div>
            
            <div class="progress-bar-bg">
              <div 
                class="progress-bar-fill" 
                :style="{ width: item.percentage + '%', backgroundColor: item.color }"
              ></div>
            </div>
            
            <span class="cat-percentage">{{ item.percentage }}% от всех расходов</span>
          </div>
        </div>

      </div>

      <div v-else class="empty-analytics">
        <AppIcon name="analytics" :size="44" class="empty-icon" />
        <p>Нет данных за выбранный период</p>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceStore } from '@/store/financeStore'
import AppIcon from '@/components/AppIcon.vue'
import type { Transaction } from '@/domain/types'

const store = useFinanceStore()

const currentPeriod = ref<'month' | 'year'>('month')
const periods = [
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' }
] as const

const colorPalette = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', 
  '#5AC8FA', '#FFCC00', '#4CD964', '#FF2D55'
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

// Хелпер для поиска заголовка одиночной транзакции
const getTransactionTitle = (t: Transaction) => {
  const cat = store.categories.find(c => c.id === t.categoryId)
  return cat?.name || t.note || 'Расход'
}

// Базовая фильтрация транзакций текущего периода (и доходы, и расходы)
const periodTransactions = computed(() => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  return store.transactions.filter(t => {
    const tDate = new Date(t.date)
    if (currentPeriod.value === 'year') {
      return tDate.getFullYear() === currentYear
    } else {
      return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth
    }
  })
})

// Сумма ДОХОДОВ за период
const totalIncome = computed(() => {
  return periodTransactions.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
})

// Сумма РАСХОДОВ за период
const totalExpense = computed(() => {
  return periodTransactions.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
})

// СРЕДНИЙ РАСХОД В ДЕНЬ
const dailyAverage = computed(() => {
  if (totalExpense.value === 0) return 0
  
  const now = new Date()
  let days = now.getDate() // Сколько дней прошло с начала месяца

  if (currentPeriod.value === 'year') {
    // Если выбран год, считаем дни с 1 января текущего года по сегодня
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const diffTime = Math.abs(now.getTime() - startOfYear.getTime())
    days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1
  }

  return Math.round(totalExpense.value / days)
})

// САМАЯ ДОРОГАЯ ОДИНОЧНАЯ ПОКУПКА
const topSingleTransaction = computed(() => {
  const expenses = periodTransactions.value.filter(t => t.type === 'expense')
  if (expenses.length === 0) return null
  return expenses.reduce((max, t) => t.amount > max.amount ? t : max, expenses[0])
})

// Разбивка расходов по категориям
const categoryBreakdown = computed(() => {
  if (totalExpense.value === 0) return []

  const breakdownMap: Record<string, number> = {}
  
  periodTransactions.value
    .filter(t => t.type === 'expense')
    .forEach(t => {
      if (t.categoryId) {
        breakdownMap[t.categoryId] = (breakdownMap[t.categoryId] || 0) + t.amount
      }
    })

  return Object.entries(breakdownMap)
    .map(([catId, amount], index) => {
      const cat = store.categories.find(c => c.id === catId)
      const percentage = Math.round((amount / totalExpense.value) * 100)
      return {
        id: catId,
        name: cat?.name || 'Разное',
        icon: cat?.iconName || 'wallet',
        amount,
        percentage,
        color: colorPalette[index % colorPalette.length]
      }
    })
    .sort((a, b) => b.amount - a.amount)
})

// Сектора для SVG-пончика
const chartSectors = computed(() => {
  let currentOffset = 25
  return categoryBreakdown.value.map(item => {
    const offset = currentOffset
    currentOffset -= item.percentage
    return {
      percentage: item.percentage,
      offset: offset,
      color: item.color
    }
  })
})
</script>

<style scoped>
.analytics-view {
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

/* iOS Сегмент контроллер */
.period-segments {
  display: flex;
  background-color: #1c1c1e;
  padding: 2px;
  border-radius: 10px;
  margin-bottom: 16px;
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
}

.segment-btn.active {
  background-color: #2c2c2e;
  color: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

/* Стили новых карточек сводки */
.summary-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.summary-card {
  background-color: #1c1c1e;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 11px;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.summary-amount {
  font-size: 17px;
  font-weight: 600;
}

.text-income { color: var(--accent-green); }
.text-expense-alt { color: #ffffff; }

/* Дополнительные инсайты */
.insights-block {
  background-color: #1c1c1e;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 16px;
}

.insight-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.insight-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.insight-label {
  font-size: 11px;
  color: #8e8e93;
}

.insight-value {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
}

.insight-value small {
  font-size: 11px;
  color: #8e8e93;
  font-weight: 400;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Карточка графика */
.chart-card {
  background-color: #1c1c1e;
  border-radius: 16px;
  padding: 20px 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
}

.chart-wrapper {
  position: relative;
  width: 170px;
  height: 170px;
}

.donut-chart {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.chart-inner-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 80%;
}

.inner-label {
  font-size: 11px;
  color: #8e8e93;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.inner-amount {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* Список разбивки */
.sub-title {
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
  padding-left: 4px;
}

.breakdown-list {
  background-color: #1c1c1e;
  border-radius: 16px;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
}

.breakdown-item {
  display: flex !important;
  align-items: flex-start !important;
  padding: 14px 0;
  list-style: none !important;
}

.breakdown-item:not(:last-child) {
  border-bottom: 0.5px solid #2c2c2e;
}

.breakdown-icon-circle {
  width: 36px !important;
  height: 36px !important;
  border-radius: 50% !important;
  background-color: #2c2c2e !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-right: 12px !important;
  flex-shrink: 0;
}

.breakdown-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.cat-name { font-size: 15px; font-weight: 500; color: #ffffff; }
.cat-amount { font-size: 15px; font-weight: 600; color: #ffffff; }

.progress-bar-bg {
  width: 100%;
  height: 4px;
  background-color: #2c2c2e;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.cat-percentage { font-size: 11px; color: #8e8e93; }
.empty-analytics { text-align: center; padding: 40px 16px; color: #8e8e93; }
.empty-icon { color: #2c2c2e; margin-bottom: 12px; }
</style>