<template>
  <div class="dashboard scrollable-content">

    <!-- Balance Card -->
    <div class="balance-card">
      <p class="balance-label">Общий баланс</p>
      <h1 class="balance-amount">{{ formatCurrency(store.totalBalance) }}</h1>
      <div class="balance-stats">
        <div class="bal-stat">
          <span class="bal-stat-label">↑ Доходы</span>
          <span class="bal-stat-value income">{{ formatCurrency(totalIncome) }}</span>
        </div>
        <div class="bal-divider"></div>
        <div class="bal-stat">
          <span class="bal-stat-label">↓ Расходы</span>
          <span class="bal-stat-value expense">{{ formatCurrency(totalExpense) }}</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="actions">
      <button class="act-btn act-expense" @click="openModal('expense')">
        <div class="act-ico">
          <AppIcon name="arrow-down" :size="18" />
        </div>
        <span>Расход</span>
      </button>
      <button class="act-btn act-income" @click="openModal('income')">
        <div class="act-ico">
          <AppIcon name="salary" :size="18" />
        </div>
        <span>Доход</span>
      </button>
      <button class="act-btn act-transfer" @click="openModal('transfer')">
        <div class="act-ico">
          <AppIcon name="transfer" :size="18" />
        </div>
        <span>Перевод</span>
      </button>
    </div>

    <!-- Categories -->
    <section class="section">
      <h2 class="section-title">Категории</h2>
      <div class="cats-grid">
        <div
          v-for="cat in expenseCategories"
          :key="cat.id"
          class="cat-item"
          @click="openCategoryDetail(cat)"
        >
          <div class="cat-ico-wrap">
            <AppIcon :name="cat.iconName" :size="22" />
          </div>
          <span class="cat-name">{{ cat.name }}</span>
          <template v-if="cat.monthlyLimit !== null">
            <div class="cat-progress">
              <div
                class="cat-progress-fill"
                :class="{ over: getCategorySpentThisMonth(cat.id) > cat.monthlyLimit }"
                :style="{ width: Math.min(getCategorySpentThisMonth(cat.id) / cat.monthlyLimit * 100, 100) + '%' }"
              ></div>
            </div>
            <span class="cat-spent">{{ formatShort(getCategorySpentThisMonth(cat.id)) }}</span>
          </template>
          <template v-else>
            <div class="cat-progress"><div class="cat-progress-fill" style="width:0%"></div></div>
            <span class="cat-spent">{{ formatShort(getCategorySpentThisMonth(cat.id)) }}</span>
          </template>
        </div>

        <div class="cat-item cat-add" @click="openAddCategoryModal">
          <div class="cat-ico-wrap cat-ico-dashed">
            <AppIcon name="plus" :size="20" />
          </div>
          <span class="cat-name" style="color:var(--text-3)">Добавить</span>
          <div class="cat-progress" style="opacity:0"></div>
          <span class="cat-spent" style="opacity:0">—</span>
        </div>
      </div>
    </section>

    <!-- Wallets -->
    <section class="section">
      <h2 class="section-title">Кошельки</h2>
      <div class="wallets-list">
        <div
          v-for="wallet in activeWallets"
          :key="wallet.id"
          class="wallet-row"
        >
          <div class="wallet-left">
            <div class="wallet-ico">
              <AppIcon name="wallet" :size="18" />
            </div>
            <div>
              <p class="wallet-name">{{ wallet.name }}</p>
            </div>
          </div>
          <span class="wallet-bal">{{ formatCurrency(store.walletBalances[wallet.id] || 0) }}</span>
        </div>
      </div>
    </section>

    <!-- ── Add Transaction Modal ── -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        <form @submit.prevent="submitTransaction" class="transaction-form">
          <div class="form-group">
            <label>Сумма (₽)</label>
            <input type="number" v-model="form.amount" required min="0.01" step="0.01" placeholder="0" />
          </div>
          <div class="form-group">
            <label>Дата</label>
            <input type="date" v-model="form.date" required />
          </div>
          <div v-if="modalType === 'expense' || modalType === 'transfer'" class="form-group">
            <label>{{ modalType === 'transfer' ? 'Откуда' : 'Кошелёк' }}</label>
            <select v-model="form.fromWalletId" required>
              <option disabled value="">Выберите кошелёк</option>
              <option v-for="w in activeWallets" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div v-if="modalType === 'income' || modalType === 'transfer'" class="form-group">
            <label>{{ modalType === 'transfer' ? 'Куда' : 'Кошелёк' }}</label>
            <select v-model="form.toWalletId" required>
              <option disabled value="">Выберите кошелёк</option>
              <option v-for="w in activeWallets" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div v-if="modalType !== 'transfer'" class="form-group">
            <label>Категория</label>
            <select v-model="form.categoryId" required>
              <option disabled value="">Выберите категорию</option>
              <option v-for="c in availableCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Пометка</label>
            <input type="text" v-model="form.note" placeholder="Например: Обед в кафе" />
          </div>
          <button type="submit" class="submit-btn">Сохранить</button>
        </form>
      </div>
    </div>

    <!-- ── Category Detail Modal ── -->
    <div v-if="isCategoryModalOpen && selectedCategory" class="modal-overlay" @click.self="closeCategoryModal">
      <div class="modal-content max-height-modal">
        <div class="modal-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="cat-ico-wrap small-ico">
              <AppIcon :name="selectedCategory.iconName" :size="16" />
            </div>
            <h3>{{ selectedCategory.name }}</h3>
          </div>
          <button class="close-btn" @click="closeCategoryModal">✕</button>
        </div>

        <div class="quick-expense-form">
          <p class="quick-form-title">Быстрый расход</p>
          <div class="quick-row">
            <input type="number" v-model="catForm.amount" min="0.01" step="0.01" placeholder="Сумма ₽" />
            <select v-model="catForm.fromWalletId">
              <option disabled value="">Кошелёк</option>
              <option v-for="w in activeWallets" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div class="quick-row">
            <input type="text" v-model="catForm.note" placeholder="Комментарий..." style="flex:1" />
            <button class="ok-btn" @click="submitCategoryExpense">ОК</button>
          </div>
        </div>

        <div class="cat-history">
          <p class="quick-form-title">История</p>
          <div class="cat-history-list">
            <div v-for="t in categoryTransactions" :key="t.id" class="cat-hist-row">
              <div>
                <p class="cat-hist-note">{{ t.note || 'Без пометки' }}</p>
                <p class="cat-hist-date">{{ formatDateShort(t.date) }}</p>
              </div>
              <span class="cat-hist-amount">-{{ formatCurrency(t.amount) }}</span>
            </div>
            <div v-if="categoryTransactions.length === 0" class="cat-empty">
              Нет операций
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Add Category Modal ── -->
    <div v-if="isAddCategoryModalOpen" class="modal-overlay" @click.self="closeAddCategoryModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Новая категория</h3>
          <button class="close-btn" @click="closeAddCategoryModal">✕</button>
        </div>
        <form @submit.prevent="submitAddCategory" class="transaction-form">
          <div class="form-group">
            <label>Название</label>
            <input type="text" v-model="newCategoryForm.name" required placeholder="Например: Развлечения" />
          </div>
          <div class="form-group">
            <label>Тип</label>
            <select v-model="newCategoryForm.type" required>
              <option value="expense">Расход</option>
              <option value="income">Доход</option>
            </select>
          </div>
          <div class="form-group">
            <label>Иконка</label>
            <div class="icon-grid">
              <div
                v-for="icon in availableIcons"
                :key="icon"
                class="icon-opt"
                :class="{ selected: newCategoryForm.iconName === icon }"
                @click="newCategoryForm.iconName = icon"
              >
                <AppIcon :name="icon" :size="18" />
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Лимит в месяц ₽ (необязательно)</label>
            <input type="number" v-model="newCategoryForm.monthlyLimit" min="0" step="any" placeholder="Без лимита" />
          </div>
          <button type="submit" class="submit-btn">Создать</button>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useFinanceStore } from '@/store/financeStore'
import AppIcon from '@/components/AppIcon.vue'
import type { Category } from '@/domain/types'

const store = useFinanceStore()

const fmt = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2 })
const formatCurrency = (v: number) => fmt.format(v)
const formatShort = (v: number) => {
  if (v === 0) return '0 ₽'
  if (v >= 1000) return (v / 1000).toFixed(0) + 'к ₽'
  return v + ' ₽'
}
const formatDateShort = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

const activeWallets     = computed(() => store.wallets.filter(w => !w.isArchived))
const expenseCategories = computed(() => store.categories.filter(c => c.type === 'expense'))

const totalIncome  = computed(() => store.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const totalExpense = computed(() => store.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))

const getCategorySpentThisMonth = (id: string) => {
  const now = new Date()
  return store.transactions
    .filter(t => t.type === 'expense' && t.categoryId === id)
    .filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
    .reduce((s, t) => s + t.amount, 0)
}

// ── Transaction modal ──
const isModalOpen  = ref(false)
const modalType    = ref<'income' | 'expense' | 'transfer'>('expense')
const form = reactive({ amount: '', date: new Date().toISOString().slice(0, 10), fromWalletId: '', toWalletId: '', categoryId: '', note: '' })

const modalTitle = computed(() => ({ expense: 'Новый расход', income: 'Новый доход', transfer: 'Перевод' }[modalType.value]))
const availableCategories = computed(() => store.categories.filter(c => c.type === modalType.value))

const openModal = (type: typeof modalType.value) => {
  modalType.value = type
  Object.assign(form, { amount: '', fromWalletId: activeWallets.value.length === 1 ? activeWallets.value[0].id : '', toWalletId: '', categoryId: '', note: '' })
  isModalOpen.value = true
  store.openModal()
}
const closeModal = () => { isModalOpen.value = false; store.closeModal() }
const submitTransaction = () => {
  const amount = Math.round(parseFloat(form.amount) * 100) / 100
  if (isNaN(amount) || amount < 0.01) return
  store.addTransaction({ type: modalType.value, amount, date: form.date, note: form.note, fromWalletId: modalType.value === 'income' ? '' : form.fromWalletId, toWalletId: modalType.value === 'expense' ? '' : form.toWalletId, categoryId: modalType.value === 'transfer' ? null : form.categoryId })
  closeModal()
}

// ── Category modal ──
const isCategoryModalOpen = ref(false)
const selectedCategory    = ref<Category | null>(null)
const catForm = reactive({ amount: '', fromWalletId: '', note: '' })

const categoryTransactions = computed(() => {
  if (!selectedCategory.value) return []
  return store.transactions.filter(t => t.type === 'expense' && t.categoryId === selectedCategory.value?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const openCategoryDetail = (cat: Category) => {
  selectedCategory.value = cat
  Object.assign(catForm, { amount: '', note: '', fromWalletId: activeWallets.value.length === 1 ? activeWallets.value[0].id : '' })
  isCategoryModalOpen.value = true
  store.openModal()
}
const closeCategoryModal = () => { isCategoryModalOpen.value = false; selectedCategory.value = null; store.closeModal() }
const submitCategoryExpense = () => {
  const amount = Math.round(parseFloat(catForm.amount) * 100) / 100
  if (isNaN(amount) || amount < 0.01 || !selectedCategory.value) return
  store.addTransaction({ type: 'expense', amount, date: new Date().toISOString().slice(0, 10), note: catForm.note, fromWalletId: catForm.fromWalletId, toWalletId: '', categoryId: selectedCategory.value.id })
  catForm.amount = ''; catForm.note = ''
}

// ── Add Category modal ──
const isAddCategoryModalOpen = ref(false)
const newCategoryForm = reactive({ name: '', iconName: 'cart', monthlyLimit: null as number | null, type: 'expense' as 'income' | 'expense' })
const availableIcons = ['cart', 'bus', 'coffee', 'home', 'smile', 'salary', 'arrow-down', 'wallet', 'analytics', 'history', 'plus', 'food', 'shopping', 'health', 'education', 'travel', 'gift', 'subscription', 'utilities', 'clothing']

const openAddCategoryModal  = () => { Object.assign(newCategoryForm, { name: '', iconName: 'cart', monthlyLimit: null, type: 'expense' }); isAddCategoryModalOpen.value = true; store.openModal() }
const closeAddCategoryModal = () => { isAddCategoryModalOpen.value = false; store.closeModal() }
const submitAddCategory = () => {
  if (!newCategoryForm.name.trim()) return
  store.addCategory({ type: newCategoryForm.type, name: newCategoryForm.name.trim(), iconName: newCategoryForm.iconName, monthlyLimit: newCategoryForm.monthlyLimit })
  closeAddCategoryModal()
}
</script>

<style scoped>
.dashboard {
  padding: 16px 16px calc(var(--tab-h) + 16px);
}

/* ── Balance Card ── */
.balance-card {
  background: linear-gradient(145deg, #111128 0%, #0f0f1e 100%);
  border: 1px solid rgba(93,138,255,0.18);
  border-radius: var(--radius-xl);
  padding: 24px 22px 20px;
  margin-bottom: 14px;
  animation: fadeInUp .4s ease both;
}

.balance-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.balance-amount {
  font-size: 38px;
  font-weight: 800;
  letter-spacing: -1.5px;
  color: #fff;
  margin-bottom: 18px;
  line-height: 1;
}

.balance-stats {
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(255,255,255,0.04);
  border-radius: var(--radius-md);
  padding: 12px 16px;
}

.bal-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.bal-stat-label {
  font-size: 11px;
  color: var(--text-3);
  font-weight: 600;
}

.bal-stat-value {
  font-size: 16px;
  font-weight: 700;
}

.bal-stat-value.income  { color: var(--green); }
.bal-stat-value.expense { color: var(--red); }

.bal-divider {
  width: 1px;
  height: 32px;
  background: var(--border);
  margin: 0 16px;
}

/* ── Actions ── */
.actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 26px;
  animation: fadeInUp .4s .08s ease both;
}

.act-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1px solid var(--border);
  font-size: 12px;
  font-weight: 700;
  color: var(--text-2);
  transition: border-color .2s, transform .15s;
}
.act-btn:active { transform: scale(0.96); }

.act-ico {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.act-expense { border-color: rgba(255,69,58,0.2); }
.act-expense .act-ico { background: var(--red-dim); color: var(--red); }
.act-expense span { color: var(--red); }

.act-income { border-color: rgba(52,199,89,0.2); }
.act-income .act-ico { background: var(--green-dim); color: var(--green); }
.act-income span { color: var(--green); }

.act-transfer { border-color: rgba(255,214,10,0.15); }
.act-transfer .act-ico { background: var(--yellow-dim); color: var(--yellow); }
.act-transfer span { color: var(--yellow); }

/* ── Section ── */
.section { margin-bottom: 24px; animation: fadeInUp .4s .14s ease both; }

/* ── Categories Grid ── */
.cats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px 8px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 14px;
}

.cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform .2s;
}
.cat-item:active { transform: scale(0.93); }

.cat-ico-wrap {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--blue);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .2s, border-color .2s;
}
.cat-item:hover .cat-ico-wrap {
  background: var(--blue-dim);
  border-color: rgba(93,138,255,0.3);
}

.cat-ico-dashed {
  border-style: dashed;
  color: var(--text-3);
  background: transparent;
}

.small-ico {
  width: 34px;
  height: 34px;
  border-radius: 10px;
}

.cat-name {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-1);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.cat-progress {
  width: 100%;
  height: 3px;
  background: var(--bg-elevated);
  border-radius: 2px;
  overflow: hidden;
}
.cat-progress-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--blue);
  transition: width .4s;
}
.cat-progress-fill.over { background: var(--red); }

.cat-spent {
  font-size: 9px;
  font-weight: 600;
  color: var(--text-3);
}

/* ── Wallets ── */
.wallets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wallet-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: border-color .2s;
}
.wallet-row:hover { border-color: var(--border-hover); }

.wallet-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wallet-ico {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--blue-dim);
  color: var(--blue);
  display: flex;
  align-items: center;
  justify-content: center;
}

.wallet-name { font-size: 15px; font-weight: 600; color: var(--text-1); }
.wallet-bal  { font-size: 16px; font-weight: 700; color: var(--text-1); }

/* ── Quick Expense Form ── */
.quick-expense-form {
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  padding: 14px;
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-form-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.quick-row {
  display: flex;
  gap: 8px;
}

.ok-btn {
  width: 52px;
  height: 50px;
  border-radius: var(--radius-sm);
  background: var(--blue);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

/* ── Category History ── */
.cat-history { display: flex; flex-direction: column; gap: 10px; }

.cat-history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: none;
}
.cat-history-list::-webkit-scrollbar { display: none; }

.cat-hist-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
}
.cat-hist-note  { font-size: 14px; font-weight: 500; color: var(--text-1); }
.cat-hist-date  { font-size: 11px; color: var(--text-3); margin-top: 2px; }
.cat-hist-amount { font-size: 14px; font-weight: 700; color: var(--red); }
.cat-empty { text-align: center; color: var(--text-3); font-size: 13px; padding: 16px 0; }

/* ── Icon Grid ── */
.icon-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 6px;
}
.icon-opt {
  height: 40px;
  border-radius: 10px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-2);
  transition: background .15s, border-color .15s;
}
.icon-opt:hover   { background: var(--bg-elevated); }
.icon-opt.selected { background: var(--blue); color: #fff; border-color: var(--blue); }

.max-height-modal { max-height: 92vh; }
</style>