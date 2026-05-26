<template>
  <div class="settings scrollable-content">

    <section class="settings-section">
      <p class="section-label">Данные</p>
      <div class="settings-group">
        <button class="settings-row" @click="handleExport">
          <div class="settings-row-left">
            <div class="settings-ico ico-blue">
              <AppIcon name="history" :size="18" />
            </div>
            <span>Экспорт JSON</span>
          </div>
          <span class="settings-chevron">›</span>
        </button>
        <div class="settings-divider"></div>
        <button class="settings-row" @click="triggerFileInput">
          <div class="settings-row-left">
            <div class="settings-ico ico-green">
              <AppIcon name="arrow-down" :size="18" />
            </div>
            <span>Импорт JSON</span>
          </div>
          <span class="settings-chevron">›</span>
        </button>
        <input type="file" ref="fileInputRef" accept=".json" style="display:none" @change="handleImport" />
      </div>
      <p class="section-hint">Данные хранятся только на устройстве. Делайте экспорт регулярно.</p>
    </section>

    <section class="settings-section">
      <div class="section-header-row">
        <p class="section-label">Кошельки</p>
        <button class="add-link" @click="addNewWallet">+ Добавить</button>
      </div>
      <div class="settings-group">
        <div
          v-for="(wallet, i) in store.wallets"
          :key="wallet.id"
        >
          <div class="settings-row">
            <div class="settings-row-left">
              <div class="settings-ico ico-blue">
                <AppIcon name="wallet" :size="18" />
              </div>
              <span :class="{ archived: wallet.isArchived }">{{ wallet.name }}</span>
            </div>
            <button class="archive-btn" :class="{ restore: wallet.isArchived }" @click="toggleArchive(wallet.id)">
              {{ wallet.isArchived ? 'Вернуть' : 'Архив' }}
            </button>
          </div>
          <div v-if="i < store.wallets.length - 1" class="settings-divider"></div>
        </div>
      </div>
    </section>

    <section class="settings-section">
      <p class="section-label">Категории</p>
      <div class="settings-group stats-row">
        <div class="stat-item">
          <span class="stat-num">{{ store.categories.filter(c => c.type === 'income').length }}</span>
          <span class="stat-lbl">доходов</span>
        </div>
        <div class="stat-sep"></div>
        <div class="stat-item">
          <span class="stat-num">{{ store.categories.filter(c => c.type === 'expense').length }}</span>
          <span class="stat-lbl">расходов</span>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFinanceStore } from '@/store/financeStore'
import AppIcon from '@/components/AppIcon.vue'

const store = useFinanceStore()
const fileInputRef = ref<HTMLInputElement | null>(null)

const handleExport = () => store.exportData()
const triggerFileInput = () => fileInputRef.value?.click()
const handleImport = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    const content = ev.target?.result
    if (typeof content === 'string') {
      const result = store.importData(content)
      alert(result.success ? 'Данные импортированы!' : `Ошибка: ${result.error}`)
    }
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
  reader.readAsText(file)
}

const addNewWallet = () => {
  const name = prompt('Название кошелька:')
  if (name?.trim()) store.addWallet(name.trim())
}

const toggleArchive = (id: string) => {
  const w = store.wallets.find(w => w.id === id)
  if (w) store.editWallet(id, w.name, !w.isArchived)
}
</script>

<style scoped>
.settings { padding: 16px 16px calc(var(--tab-h) + 24px); }

.settings-section { margin-bottom: 28px; }

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.7px;
  margin-bottom: 8px;
  padding-left: 4px;
}

.section-hint {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 8px;
  padding-left: 4px;
  line-height: 1.5;
}

.add-link {
  background: transparent;
  color: var(--blue);
  font-size: 14px;
  font-weight: 700;
  padding: 0;
}

.settings-group {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: transparent;
  color: var(--text-1);
  font-size: 15px;
  font-weight: 500;
  width: 100%;
  text-align: left;
}

.settings-row-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-ico {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ico-blue  { background: var(--blue-dim);  color: var(--blue); }
.ico-green { background: var(--green-dim); color: var(--green); }

.settings-chevron {
  font-size: 20px;
  color: var(--text-3);
  font-weight: 400;
  line-height: 1;
}

.settings-divider {
  height: 0.5px;
  background: var(--border);
  margin-left: 62px;
}

.archived {
  text-decoration: line-through;
  color: var(--text-3);
}

.archive-btn {
  background: var(--red-dim);
  color: var(--red);
  font-size: 12px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 8px;
}
.archive-btn.restore {
  background: var(--green-dim);
  color: var(--green);
}

/* Stats */
.stats-row {
  display: flex;
  align-items: center;
  padding: 18px 20px;
}
.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.stat-num { font-size: 28px; font-weight: 800; color: var(--text-1); letter-spacing: -1px; }
.stat-lbl { font-size: 12px; font-weight: 600; color: var(--text-3); }
.stat-sep { width: 1px; height: 40px; background: var(--border); }
</style>