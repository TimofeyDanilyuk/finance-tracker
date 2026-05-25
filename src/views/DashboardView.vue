<template>
  <div class="dashboard-view scrollable-content">
    
    <header class="balance-card">
      <p class="balance-label">Общий баланс</p>
      <h1 class="balance-amount">{{ formatCurrency(store.totalBalance) }}</h1>
    </header>

    <div class="action-buttons">
      <button class="btn-expense" @click="openModal('expense')">
        <AppIcon name="arrow-down" :size="20" /> 
        <span>Расход</span>
      </button>
      <button class="btn-income" @click="openModal('income')">
        <AppIcon name="salary" :size="20" /> 
        <span>Доход</span>
      </button>
      <button class="btn-transfer" @click="openModal('transfer')">
        <AppIcon name="transfer" :size="20" /> 
        <span>Перевод</span>
      </button>
    </div>

    <section class="categories-section">
      <h2 class="section-title">Категории расходов</h2>
      <div class="categories-grid">
        <div
          v-for="cat in expenseCategories"
          :key="cat.id"
          class="category-grid-item"
          @click="openCategoryDetail(cat)"
        >
          <div class="category-icon-wrapper">
            <AppIcon :name="cat.iconName" :size="24" />
          </div>
          <span class="category-grid-name">{{ cat.name }}</span>
          <div class="category-limit-details" v-if="cat.monthlyLimit !== null">
            <div class="limit-numbers">
              <span class="limit-spent">{{ formatCurrency(getCategorySpentThisMonth(cat.id)) }}</span>
              <span class="limit-separator">/</span>
              <span class="limit-total">{{ formatCurrency(cat.monthlyLimit) }}</span>
            </div>
            <div class="limit-bar" :class="{ exceeded: getCategorySpentThisMonth(cat.id) > cat.monthlyLimit }">
              <div class="limit-bar-fill" :style="{ width: Math.min(getCategorySpentThisMonth(cat.id) / cat.monthlyLimit * 100, 100) + '%' }"></div>
            </div>
          </div>
          <div class="category-limit-details" v-else>
            <div class="limit-numbers">
              <span class="limit-spent">{{ formatCurrency(getCategorySpentThisMonth(cat.id)) }}</span>
              <span class="limit-no-limit">без лимита</span>
            </div>
            <div class="limit-bar">
              <div class="limit-bar-fill" :style="{ width: '0%' }"></div>
            </div>
          </div>
        </div>
        <!-- Кнопка добавления категории -->
        <div
          class="category-grid-item add-category"
          @click="openAddCategoryModal"
        >
          <div class="category-icon-wrapper add-category-icon">
            <AppIcon name="plus" :size="24" />
          </div>
          <span class="category-grid-name">Добавить</span>
        </div>
      </div>
    </section>

    <section class="wallets-section">
      <h2 class="section-title">Мои кошельки</h2>
      <div class="wallets-list">
        <div 
          v-for="wallet in activeWallets" 
          :key="wallet.id" 
          class="wallet-item"
        >
          <div class="wallet-info">
            <AppIcon name="wallet" :size="22" class="wallet-icon" />
            <span class="wallet-name">{{ wallet.name }}</span>
          </div>
          <span class="wallet-balance">{{ formatCurrency(store.walletBalances[wallet.id] || 0) }}</span>
        </div>
      </div>
    </section>

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
            <label>{{ modalType === 'transfer' ? 'Откуда перевести' : 'Кошелек' }}</label>
            <select v-model="form.fromWalletId" required>
              <option disabled value="">Выберите кошелек</option>
              <option v-for="w in activeWallets" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div v-if="modalType === 'income' || modalType === 'transfer'" class="form-group">
            <label>{{ modalType === 'transfer' ? 'Куда перевести' : 'Кошелек' }}</label>
            <select v-model="form.toWalletId" required>
              <option disabled value="">Выберите кошелек</option>
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

    <div v-if="isCategoryModalOpen && selectedCategory" class="modal-overlay" @click.self="closeCategoryModal">
      <div class="modal-content max-height-modal">
        <div class="modal-header">
          <div class="modal-title-with-icon">
            <div class="category-icon-wrapper small-circle">
              <AppIcon :name="selectedCategory.iconName" :size="18" />
            </div>
            <h3>{{ selectedCategory.name }}</h3>
          </div>
          <button class="close-btn" @click="closeCategoryModal">✕</button>
        </div>

        <form @submit.prevent="submitCategoryExpense" class="category-quick-form">
          <h4 class="sub-block-title">Записать расход</h4>
          <div class="form-row-grid">
            <input type="number" v-model="catForm.amount" required min="0.01" step="0.01" placeholder="Сумма (₽)" />
            <select v-model="catForm.fromWalletId" required>
              <option disabled value="">Кошелек</option>
              <option v-for="w in activeWallets" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div class="form-row-grid single-row">
            <input type="text" v-model="catForm.note" placeholder="Комментарий к расходу..." />
            <button type="submit" class="mini-submit-btn">ОК</button>
          </div>
        </form>

        <div class="category-history-block">
          <h4 class="sub-block-title">История по категории</h4>
          <div class="category-history-list">
            <div 
              v-for="t in categoryTransactions" 
              :key="t.id" 
              class="cat-history-item"
            >
              <div class="cat-hist-left">
                <span class="cat-hist-date">{{ formatDateShort(t.date) }}</span>
                <span class="cat-hist-note">{{ t.note || 'Без пометки' }}</span>
              </div>
              <span class="cat-hist-amount">-{{ formatCurrency(t.amount) }}</span>
            </div>
            <div v-if="categoryTransactions.length === 0" class="cat-empty-history">
              Операций по этой категории пока не было
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно добавления категории -->
    <div v-if="isAddCategoryModalOpen" class="modal-overlay" @click.self="closeAddCategoryModal">
      <div class="modal-content max-height-modal">
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
            <div class="icon-selector-grid">
              <div
                v-for="icon in availableIcons"
                :key="icon"
                class="icon-option"
                :class="{ selected: newCategoryForm.iconName === icon }"
                @click="newCategoryForm.iconName = icon"
              >
                <AppIcon :name="icon" :size="20" />
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Лимит на месяц (₽) (необязательно)</label>
            <input
              type="number"
              v-model="newCategoryForm.monthlyLimit"
              min="0"
              step="any"
              placeholder="Оставьте пустым, если без лимита"
            />
            <small class="hint">Лимит можно превысить, но будет отображаться предупреждение</small>
          </div>
          <button type="submit" class="submit-btn">Создать категорию</button>
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatDateShort = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

const activeWallets = computed(() => store.wallets.filter(w => !w.isArchived))
const expenseCategories = computed(() => store.categories.filter(c => c.type === 'expense'))

// --- Общая модалка ---
const isModalOpen = ref(false)
const modalType = ref<'income' | 'expense' | 'transfer'>('expense')
const form = reactive({
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  fromWalletId: '',
  toWalletId: '',
  categoryId: '',
  note: ''
})

const modalTitle = computed(() => {
  if (modalType.value === 'expense') return 'Новый расход'
  if (modalType.value === 'income') return 'Новый доход'
  return 'Перевод между кошельками'
})

const availableCategories = computed(() => store.categories.filter(c => c.type === modalType.value))

const openModal = (type: 'income' | 'expense' | 'transfer') => {
  modalType.value = type
  form.amount = ''
  form.fromWalletId = activeWallets.value.length === 1 ? activeWallets.value[0].id : ''
  form.toWalletId = activeWallets.value.length === 1 && type === 'income' ? activeWallets.value[0].id : ''
  form.categoryId = ''
  form.note = ''
  isModalOpen.value = true
  store.openModal()
}

const closeModal = () => {
  isModalOpen.value = false
  store.closeModal()
}

const submitTransaction = () => {
  const amountNum = parseFloat(form.amount)
  if (isNaN(amountNum) || amountNum < 0.01) return
  
  const roundedAmount = Math.round(amountNum * 100) / 100
  
  store.addTransaction({
    type: modalType.value,
    amount: roundedAmount,
    date: form.date,
    note: form.note,
    fromWalletId: modalType.value === 'income' ? '' : form.fromWalletId,
    toWalletId: modalType.value === 'expense' ? '' : form.toWalletId,
    categoryId: modalType.value === 'transfer' ? null : form.categoryId
  })
  closeModal()
}

// --- Модалка категории ---
const isCategoryModalOpen = ref(false)
const selectedCategory = ref<Category | null>(null)
const catForm = reactive({
  amount: '',
  fromWalletId: '',
  note: ''
})

const categoryTransactions = computed(() => {
  if (!selectedCategory.value) return []
  return store.transactions
    .filter(t => t.type === 'expense' && t.categoryId === selectedCategory.value?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const openCategoryDetail = (category: Category) => {
  selectedCategory.value = category
  catForm.amount = ''
  catForm.note = ''
  catForm.fromWalletId = activeWallets.value.length === 1 ? activeWallets.value[0].id : ''
  isCategoryModalOpen.value = true
  store.openModal()
}

const closeCategoryModal = () => {
  isCategoryModalOpen.value = false
  selectedCategory.value = null
  store.closeModal()
}

const submitCategoryExpense = () => {
  const amountNum = parseFloat(catForm.amount)
  if (isNaN(amountNum) || amountNum < 0.01 || !selectedCategory.value) return

  const roundedAmount = Math.round(amountNum * 100) / 100

  store.addTransaction({
    type: 'expense',
    amount: roundedAmount,
    date: new Date().toISOString().slice(0, 10),
    note: catForm.note,
    fromWalletId: catForm.fromWalletId,
    toWalletId: '',
    categoryId: selectedCategory.value.id
  })

  catForm.amount = ''
  catForm.note = ''
}

// --- Модалка добавления категории ---
const isAddCategoryModalOpen = ref(false)
const newCategoryForm = reactive({
  name: '',
  iconName: 'cart',
  monthlyLimit: null as number | null,
  type: 'expense' as 'income' | 'expense'
})

// Список доступных иконок для выбора
const availableIcons = [
  'cart', 'bus', 'coffee', 'home', 'smile', 'salary', 'arrow-down', 'wallet', 'analytics', 'history',
  'plus', 'food', 'shopping', 'health', 'education', 'travel', 'gift', 'subscription', 'utilities', 'clothing'
]

// Вычисление потраченной суммы по категории за текущий месяц
const getCategorySpentThisMonth = (categoryId: string) => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return store.transactions
    .filter(t => t.type === 'expense' && t.categoryId === categoryId)
    .filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, t) => sum + t.amount, 0)
}

const openAddCategoryModal = () => {
  newCategoryForm.name = ''
  newCategoryForm.iconName = 'cart'
  newCategoryForm.monthlyLimit = null
  newCategoryForm.type = 'expense'
  isAddCategoryModalOpen.value = true
  store.openModal()
}

const closeAddCategoryModal = () => {
  isAddCategoryModalOpen.value = false
  store.closeModal()
}

const submitAddCategory = () => {
  if (!newCategoryForm.name.trim()) return

  store.addCategory({
    type: newCategoryForm.type,
    name: newCategoryForm.name.trim(),
    iconName: newCategoryForm.iconName,
    monthlyLimit: newCategoryForm.monthlyLimit
  })

  closeAddCategoryModal()
}
</script>

<style scoped>
.dashboard-view {
  padding: 16px;
  padding-bottom: 80px;
  box-sizing: border-box;
}

/* Баланс */
.balance-card {
  text-align: center;
  padding: 28px 20px;
  background: var(--bg-glass);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 24px;
  border: 1px solid var(--glass-border);
  margin-bottom: 24px;
  box-shadow: 0 12px 40px var(--shadow-color);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.balance-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px var(--shadow-color);
}

.balance-label {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.balance-amount {
  font-size: 42px;
  font-weight: 800;
  color: #ffffff;
  background: linear-gradient(135deg, #ffffff, #a0a0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Быстрые действия */
.action-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.action-buttons button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 8px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 18px;
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  transition: all 0.3s ease;
  cursor: pointer;
}

.action-buttons button:hover {
  transform: translateY(-4px);
  border-color: var(--accent-blue);
  box-shadow: 0 8px 24px rgba(93, 138, 255, 0.2);
}

.action-buttons button.btn-expense {
  color: var(--accent-red);
  border-color: rgba(255, 69, 58, 0.3);
}
.action-buttons button.btn-expense:hover {
  border-color: var(--accent-red);
  box-shadow: 0 8px 24px rgba(255, 69, 58, 0.2);
}

.action-buttons button.btn-income {
  color: var(--accent-green);
  border-color: rgba(48, 209, 88, 0.3);
}
.action-buttons button.btn-income:hover {
  border-color: var(--accent-green);
  box-shadow: 0 8px 24px rgba(48, 209, 88, 0.2);
}

.action-buttons button.btn-transfer {
  color: var(--accent-yellow);
  border-color: rgba(255, 193, 7, 0.3);
}
.action-buttons button.btn-transfer:hover {
  border-color: var(--accent-yellow);
  box-shadow: 0 8px 24px rgba(255, 193, 7, 0.2);
}

/* КАТЕГОРИИ: Жесткий фикс отображения */
.categories-section {
  margin-bottom: 28px;
  display: block;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-left: 4px;
}

.categories-grid {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important; /* Строго 4 колонки */
  gap: 20px 12px !important;
  background: var(--bg-glass) !important;
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  border: 1px solid var(--glass-border) !important;
  padding: 24px 16px !important;
  border-radius: 24px !important;
  list-style: none !important;
  list-style-type: none !important;
  box-shadow: 0 12px 40px var(--shadow-color);
}

.category-grid-item {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  cursor: pointer;
  list-style: none !important;
  list-style-type: none !important;
  transition: transform 0.3s ease;
}

.category-grid-item:hover {
  transform: translateY(-6px);
}

/* Иконка в идеальном круге */
.category-icon-wrapper {
  width: 60px !important;
  height: 60px !important;
  border-radius: 50% !important;
  background: var(--bg-glass) !important;
  border: 2px solid var(--glass-border) !important;
  color: var(--accent-blue) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-bottom: 12px !important;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.category-grid-item:hover .category-icon-wrapper {
  border-color: var(--accent-blue);
  background: rgba(93, 138, 255, 0.1) !important;
  transform: scale(1.05);
  box-shadow: 0 12px 28px rgba(93, 138, 255, 0.3);
}

.category-grid-name {
  font-size: 12px !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  width: 100% !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  display: block !important;
}

/* Кошельки */
.wallets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wallet-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background-color: #1c1c1e;
  border-radius: 14px;
}

.wallet-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wallet-icon { color: var(--accent-blue); }
.wallet-name { font-size: 15px; color: #ffffff; }
.wallet-balance { font-size: 15px; font-weight: 600; color: #ffffff; }

/* Модалки (Fullscreen) */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
  padding: 20px;
  box-sizing: border-box;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: #1c1c1e;
  width: 100%;
  max-width: 500px;
  border-radius: 20px;
  padding: 24px;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
  box-sizing: border-box;
  max-height: 90vh;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease;
}

.modal-content::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* Убедимся, что форма внутри может скроллиться */
.modal-content .transaction-form {
  flex: 1;
  min-height: 0;
}

/* На мобильных устройствах модалка почти на всю ширину */
@media (max-width: 600px) {
  .modal-content {
    max-width: 100%;
    border-radius: 20px 20px 0 0;
    max-height: 95vh;
  }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.max-height-modal {
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.max-height-modal::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* Убедимся, что внутренний контент может растягиваться */
.max-height-modal .category-history-block {
  flex: 1;
  min-height: 0; /* Важно для скролла внутри flex-контейнера */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-title-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.small-circle {
  width: 32px !important;
  height: 32px !important;
  margin-bottom: 0 !important;
  background-color: #2c2c2e !important;
}

.close-btn {
  background: #2c2c2e;
  color: #8e8e93;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border: none;
}

/* Формы */
.transaction-form { display: flex; flex-direction: column; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: 12px; color: #8e8e93; padding-left: 2px; }
.submit-btn {
  margin-top: 8px;
  background-color: var(--accent-blue);
  color: white;
  height: 46px;
  border-radius: 12px;
  font-weight: 600;
  border: none;
  align-self: center;
  max-width: 200px;
  width: auto;
  padding-left: 24px;
  padding-right: 24px;
}

.category-quick-form {
  background-color: #2c2c2e;
  padding: 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.sub-block-title {
  font-size: 12px;
  text-transform: uppercase;
  color: #8e8e93;
  letter-spacing: 0.5px;
  font-weight: 600;
  margin-bottom: 4px;
}

.form-row-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 8px;
}

.single-row { grid-template-columns: 1fr auto; }
.mini-submit-btn {
  width: 54px;
  height: 49px;
  border-radius: 8px;
  background-color: var(--accent-blue);
  color: white;
  border: none;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}
.mini-submit-btn:active {
  background-color: #4a7aff;
  transform: scale(0.98);
}

.category-history-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.category-history-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cat-history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: #2c2c2e;
  border-radius: 10px;
}

.cat-hist-left { display: flex; flex-direction: column; }
.cat-hist-date { font-size: 11px; color: #8e8e93; }
.cat-hist-note { font-size: 14px; color: #ffffff; }
.cat-hist-amount { font-size: 14px; font-weight: 600; color: var(--accent-red); }
.cat-empty-history { color: #8e8e93; text-align: center; font-size: 13px; padding: 16px 0; }

/* Стили для кнопки добавления категории */
.add-category .category-icon-wrapper {
  background-color: #2c2c2e !important;
  color: #8e8e93 !important;
  border: 1px dashed #8e8e93;
}

.add-category:active .category-icon-wrapper {
  background-color: #3a3a3c !important;
}

/* Информация о лимите категории */
.category-limit-info {
  margin-top: 4px;
  font-size: 9px;
  color: #8e8e93;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-wrap: wrap;
}

.limit-spent {
  font-weight: 600;
  color: #ffffff;
}

.limit-separator {
  color: #8e8e93;
}

.limit-total {
  color: #8e8e93;
}

.limit-no-limit {
  font-size: 8px;
  color: #8e8e93;
  margin-left: 4px;
}

.limit-bar {
  width: 100%;
  height: 3px;
  background-color: #2c2c2e;
  border-radius: 2px;
  margin-top: 2px;
  overflow: hidden;
}

.limit-bar.exceeded {
  background-color: rgba(255, 59, 48, 0.2);
}

.limit-bar-fill {
  height: 100%;
  background-color: var(--accent-blue);
  border-radius: 2px;
  transition: width 0.3s;
}

.limit-bar.exceeded .limit-bar-fill {
  background-color: var(--accent-red);
}

/* Детали лимита категории (новая структура) */
.category-limit-details {
  margin-top: 8px;
  width: 100%;
}

.limit-numbers {
  display: flex;
  justify-content: center;
  gap: 4px;
  font-size: 10px;
  margin-bottom: 4px;
}

/* Сетка выбора иконок */
.icon-selector-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.icon-option {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #2c2c2e;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.1s, transform 0.1s;
}

.icon-option:hover {
  background-color: #3a3a3c;
}

.icon-option.selected {
  background-color: var(--accent-blue);
  color: white;
}

/* Подсказка */
.hint {
  font-size: 10px;
  color: #8e8e93;
  margin-top: 2px;
}
</style>