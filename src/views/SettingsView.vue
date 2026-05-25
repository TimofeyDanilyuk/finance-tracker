<template>
  <div class="settings-view scrollable-content">
    
    <section class="settings-section">
      <h2 class="section-title">Резервное копирование</h2>
      <p class="section-desc">Ваши данные хранятся только на этом устройстве. Регулярно делайте экспорт.</p>
      
      <div class="actions-grid">
        <button class="action-btn export-btn" @click="handleExport">
          <AppIcon name="history" :size="20" /> Экспорт JSON
        </button>
        
        <button class="action-btn import-btn" @click="triggerFileInput">
          <AppIcon name="arrow-down" :size="20" />
          Импорт JSON
        </button>
        
        <input 
          type="file" 
          ref="fileInputRef" 
          accept=".json" 
          style="display: none" 
          @change="handleImport" 
        />
      </div>
    </section>

    <section class="settings-section">
      <div class="section-header">
        <h2 class="section-title">Кошельки</h2>
        <button class="icon-add-btn" @click="addNewWallet">
          <span>+ Добавить</span>
        </button>
      </div>

      <div class="list-container">
        <div 
          v-for="wallet in store.wallets" 
          :key="wallet.id" 
          class="list-item"
        >
          <div class="item-info">
            <AppIcon name="wallet" :size="24" class="item-icon" />
            <span :class="{ 'archived-text': wallet.isArchived }">{{ wallet.name }}</span>
          </div>
          <button 
            class="toggle-btn" 
            @click="toggleArchive(wallet.id)"
          >
            {{ wallet.isArchived ? 'Вернуть' : 'В архив' }}
          </button>
        </div>
      </div>
    </section>

    <section class="settings-section">
      <h2 class="section-title">Категории</h2>
      <p class="section-desc">
        Всего категорий доходов: {{ store.categories.filter(c => c.type === 'income').length }}<br>
        Всего категорий расходов: {{ store.categories.filter(c => c.type === 'expense').length }}
      </p>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFinanceStore } from '@/store/financeStore'
import AppIcon from '@/components/AppIcon.vue'

const store = useFinanceStore()
const fileInputRef = ref<HTMLInputElement | null>(null)

// --- Логика Экспорта/Импорта ---
const handleExport = () => {
  store.exportData()
}

const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleImport = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result
    if (typeof content === 'string') {
      const result = store.importData(content)
      if (result.success) {
        alert('Данные успешно импортированы!')
      } else {
        alert(`Ошибка импорта: ${result.error}`)
      }
    }
    // Сбрасываем инпут, чтобы можно было выбрать тот же файл еще раз
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
  reader.readAsText(file)
}

// --- Логика управления кошельками ---
const addNewWallet = () => {
  const name = prompt('Введите название нового кошелька:')
  if (name && name.trim()) {
    store.addWallet(name.trim())
  }
}

const toggleArchive = (id: string) => {
  const wallet = store.wallets.find(w => w.id === id)
  if (wallet) {
    store.editWallet(id, wallet.name, !wallet.isArchived)
  }
}
</script>

<style scoped>
.settings-view {
  padding: 20px;
  padding-bottom: 40px; /* Отступ от таббара */
}

.settings-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.section-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

/* Кнопки импорта/экспорта */
.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  border-radius: 18px;
  padding: 16px 12px;
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  transition: all 0.3s ease;
  cursor: pointer;
  font-weight: 600;
}

.action-btn:hover {
  transform: translateY(-4px);
  border-color: var(--accent-blue);
  box-shadow: 0 8px 24px rgba(93, 138, 255, 0.2);
}

.export-btn {
  color: var(--accent-blue);
  border-color: rgba(93, 138, 255, 0.3);
}

.export-btn:hover {
  border-color: var(--accent-blue);
  box-shadow: 0 8px 24px rgba(93, 138, 255, 0.2);
}

.import-btn {
  color: var(--accent-green);
  border-color: rgba(48, 209, 88, 0.3);
}

.import-btn:hover {
  border-color: var(--accent-green);
  box-shadow: 0 8px 24px rgba(48, 209, 88, 0.2);
}

/* Списки (кошельки) */
.list-container {
  background-color: var(--bg-elevated);
  border-radius: 12px;
  overflow: hidden;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.list-item:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 500;
}

.item-icon {
  color: var(--accent-blue);
}

.archived-text {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.icon-add-btn {
  background: transparent;
  color: var(--accent-blue);
  width: auto;
  padding: 4px 8px;
  font-size: 16px;
  font-weight: 600;
}

.toggle-btn {
  background: transparent;
  color: var(--accent-red);
  font-size: 14px;
  width: auto;
  padding: 4px 8px;
}
</style>