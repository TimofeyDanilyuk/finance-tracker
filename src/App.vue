<template>
  <div class="app-wrapper">
    <div class="app-container">
      <header class="app-header">
        <h1>{{ activeTabTitle }}</h1>
      </header>

      <main class="app-main">
        <DashboardView v-if="activeTab === 'dashboard'" />
        <TransactionsView v-else-if="activeTab === 'transactions'" />
        <AnalyticsView v-else-if="activeTab === 'analytics'" />
        <SettingsView v-else-if="activeTab === 'settings'" />
      </main>

      <nav class="app-tabbar" v-if="!isAnyModalOpen">
        <button 
          class="tab-item" 
          :class="{ active: activeTab === 'dashboard' }"
          @click="activeTab = 'dashboard'"
        >
          <AppIcon name="wallet" :size="22" />
          <span>Главная</span>
        </button>

        <button 
          class="tab-item" 
          :class="{ active: activeTab === 'transactions' }"
          @click="activeTab = 'transactions'"
        >
          <AppIcon name="history" :size="22" />
          <span>История</span>
        </button>

        <button 
          class="tab-item" 
          :class="{ active: activeTab === 'analytics' }"
          @click="activeTab = 'analytics'"
        >
          <AppIcon name="analytics" :size="22" />
          <span>Аналитика</span>
        </button>

        <button 
          class="tab-item" 
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          <AppIcon name="smile" :size="22" />
          <span>Настройки</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import DashboardView from '@/views/DashboardView.vue'
import TransactionsView from '@/views/TransactionsView.vue'
import AnalyticsView from '@/views/AnalyticsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import { useFinanceStore } from '@/store/financeStore'

type Tab = 'dashboard' | 'transactions' | 'analytics' | 'settings'
const activeTab = ref<Tab>('dashboard')
const store = useFinanceStore()

const activeTabTitle = computed(() => {
  switch (activeTab.value) {
    case 'dashboard': return 'Мой Баланс'
    case 'transactions': return 'История операций'
    case 'analytics': return 'Аналитика'
    case 'settings': return 'Настройки'
  }
})

const isAnyModalOpen = computed(() => store.isAnyModalOpen)
</script>

<style scoped>
.app-wrapper {
  background-color: #0a0a0a;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.app-container {
  width: 100%;
  max-width: 430px; /* Ширина iPhone 15 Pro Max */
  height: 100vh;
  max-height: 932px;
  background-color: var(--bg-main);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.6);
}

@media (max-width: 430px) {
  .app-container {
    max-height: 100vh;
    border-radius: 0;
  }
}

.app-header {
  height: calc(54px + env(safe-area-inset-top, 0px));
  display: flex;
  align-items: center;
  padding: env(safe-area-inset-top, 0px) 20px 0;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-black);
}

.app-header h1 {
  font-size: 20px;
  font-weight: 700;
}

.app-main {
  flex: 1;
  overflow: hidden; /* Контент скроллится строго внутри страниц */
  position: relative;
}

.app-tabbar {
  display: flex;
  justify-content: space-around;
  align-items: flex-start; /* ← было center */
  padding-top: 8px;
  padding-bottom: env(safe-area-inset-bottom, 16px); /* ← safe area на содержимое, не на высоту */
  background-color: var(--bg-black);
  border-top: 1px solid var(--border-color);
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  z-index: 1000;
  border-radius: 20px 20px 0 0;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  box-shadow: none;
  padding: 0;
  width: 60px;        /* ← фиксированная ширина вместо auto */
  min-height: 44px;   /* ← минимальный hit target для iOS */
  color: var(--text-secondary);
  font-size: 10px;    /* ← было 11px, но важнее — убрать font-weight 500 */
  font-weight: 400;
  gap: 4px;
  transition: color 0.2s;
}

.tab-item.active {
  color: var(--accent-blue);
}

.tab-item:active {
  opacity: 1; /* Перебиваем глобальный opacity для таббара */
}

body {
  background-color: #0a0a0a; /* Убедись что это есть */
}
</style>