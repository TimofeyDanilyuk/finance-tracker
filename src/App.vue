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
  padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
}

.app-tabbar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: calc(60px + env(safe-area-inset-bottom, 0px));
  /* Учитываем нижний Safe Area для индикатора Home на iPhone */
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background-color: var(--bg-black);
  border-top: 1px solid var(--border-color);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
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
  outline: none;
  box-shadow: none;
  padding: 6px 0;
  width: auto;
  height: 100%;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 11px;
  gap: 4px;
  transition: color 0.2s;
}

.tab-item.active {
  color: var(--accent-blue);
}

.tab-item:active {
  opacity: 1; /* Перебиваем глобальный opacity для таббара */
}
</style>