<template>
  <div class="app-wrapper">
    <div class="app-container">

      <header class="app-header safe-area-top">
        <span class="header-title">{{ activeTabTitle }}</span>
        <div class="header-dot"></div>
      </header>

      <main class="app-main">
        <DashboardView    v-if="activeTab === 'dashboard'" />
        <TransactionsView v-else-if="activeTab === 'transactions'" />
        <AnalyticsView    v-else-if="activeTab === 'analytics'" />
        <SettingsView     v-else-if="activeTab === 'settings'" />
      </main>

      <nav class="app-tabbar" v-show="!isAnyModalOpen">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-item"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <div class="tab-icon-wrap">
            <AppIcon :name="tab.icon" :size="22" />
            <span v-if="activeTab === tab.id" class="tab-pip"></span>
          </div>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </nav>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import DashboardView    from '@/views/DashboardView.vue'
import TransactionsView from '@/views/TransactionsView.vue'
import AnalyticsView    from '@/views/AnalyticsView.vue'
import SettingsView     from '@/views/SettingsView.vue'
import { useFinanceStore } from '@/store/financeStore'

type Tab = 'dashboard' | 'transactions' | 'analytics' | 'settings'
const activeTab = ref<Tab>('dashboard')
const store = useFinanceStore()

const tabs = [
  { id: 'dashboard',    icon: 'wallet',    label: 'Главная'   },
  { id: 'transactions', icon: 'history',   label: 'История'   },
  { id: 'analytics',    icon: 'analytics', label: 'Аналитика' },
  { id: 'settings',     icon: 'smile',     label: 'Профиль'   },
] as const

const activeTabTitle = computed(() => {
  switch (activeTab.value) {
    case 'dashboard':    return 'Мой баланс'
    case 'transactions': return 'История'
    case 'analytics':    return 'Аналитика'
    case 'settings':     return 'Настройки'
  }
})

const isAnyModalOpen = computed(() => store.isAnyModalOpen)
</script>

<style scoped>
/* Враппер занимает весь экран и центрирует телефон */
.app-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: var(--bg);
}

.app-container {
  width: 100%;
  max-width: 430px;
  height: 100%;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header ── */
.app-header {
  flex-shrink: 0;
  height: calc(56px + env(safe-area-inset-top, 0px));
  display: flex;
  align-items: flex-end;
  padding: 0 22px 14px;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}

.header-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: -0.3px;
}

.header-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--blue);
  opacity: 0.7;
}

/* ── Main: flex:1 + min-height:0 — обязательно оба ── */
.app-main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

/* ── Tabbar: flex-shrink:0 — не сжимается, всегда виден ── */
.app-tabbar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  padding-top: 10px;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
  background: var(--bg-card);
  border-top: 1px solid var(--border);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  box-shadow: none;
  padding: 0;
  width: 64px;
  min-height: 44px;
  color: var(--text-3);
  transition: color .2s;
}

.tab-item.active { color: var(--blue); }

.tab-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 28px;
}

.tab-pip {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--blue);
}

.tab-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2px;
}
</style>