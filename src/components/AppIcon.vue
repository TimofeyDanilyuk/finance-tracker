<template>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    :width="size" 
    :height="size" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round"
    class="app-icon"
  >
    <!-- Зарплата / Доходы -->
    <g v-if="name === 'salary'">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </g>

    <!-- Продукты / Корзина -->
    <g v-else-if="name === 'cart'">
      <circle cx="9" cy="21" r="2"></circle>
      <circle cx="20" cy="21" r="2"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </g>

    <!-- Транспорт / Автомобиль -->
    <g v-else-if="name === 'bus'">
      <rect x="3" y="10" width="18" height="8" rx="1" ry="1"></rect>
      <circle cx="7" cy="18" r="2"></circle>
      <circle cx="17" cy="18" r="2"></circle>
      <line x1="3" y1="14" x2="21" y2="14"></line>
    </g>

    <!-- Кафе / Кофе -->
    <g v-else-if="name === 'coffee'">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
      <line x1="6" y1="1" x2="6" y2="4"></line>
      <line x1="10" y1="1" x2="10" y2="4"></line>
      <line x1="14" y1="1" x2="14" y2="4"></line>
    </g>

    <!-- Жилье / Дом -->
    <g v-else-if="name === 'home'">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </g>

    <!-- Развлечения / Смайлик -->
    <g v-else-if="name === 'smile'">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
      <line x1="9" y1="9" x2="9.01" y2="9"></line>
      <line x1="15" y1="9" x2="15.01" y2="9"></line>
    </g>

    <!-- Переводы / Стрелки -->
    <g v-else-if="name === 'transfer' || name === 'arrow-down'">
      <polyline points="17 11 12 16 7 11"></polyline>
      <line x1="12" y1="16" x2="12" y2="3"></line>
    </g>

    <!-- Иконка кошелька / Настройки -->
    <g v-else-if="name === 'wallet'">
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
      <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6z"></path>
    </g>

    <!-- Тренды / Аналитика -->
    <g v-else-if="name === 'analytics'">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </g>

    <!-- История / Списки -->
    <g v-else-if="name === 'history'">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </g>

    <!-- Плюс / Добавить -->
    <g v-else-if="name === 'plus'">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </g>

    <!-- Еда / Вилка-нож -->
    <g v-else-if="name === 'food'">
      <path d="M3 2v7c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V2"></path>
      <path d="M7 2v20"></path>
      <path d="M17 2v20"></path>
      <path d="M12 2v20"></path>
      <path d="M2 7h20"></path>
      <path d="M2 17h20"></path>
      <path d="M2 12h20"></path>
    </g>

    <!-- Покупки / Сумка -->
    <g v-else-if="name === 'shopping'">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <path d="M16 10a4 4 0 0 1-8 0"></path>
    </g>

    <!-- Здоровье / Сердце -->
    <g v-else-if="name === 'health'">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </g>

    <!-- Образование / Книга -->
    <g v-else-if="name === 'education'">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </g>

    <!-- Путешествия / Самолет -->
    <g v-else-if="name === 'travel'">
      <path d="M22 18H2a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4z"></path>
      <path d="M18 8V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2"></path>
      <path d="M12 18v-8"></path>
      <path d="M6 12h12"></path>
    </g>

    <!-- Подарок -->
    <g v-else-if="name === 'gift'">
      <polyline points="20 12 20 22 4 22 4 12"></polyline>
      <rect x="2" y="7" width="20" height="5"></rect>
      <line x1="12" y1="22" x2="12" y2="7"></line>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
    </g>

    <!-- Подписка / Повтор -->
    <g v-else-if="name === 'subscription'">
      <polyline points="1 4 1 10 7 10"></polyline>
      <polyline points="23 20 23 14 17 14"></polyline>
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
    </g>

    <!-- Коммунальные услуги / Молния -->
    <g v-else-if="name === 'utilities'">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </g>

    <!-- Одежда / Футболка -->
    <g v-else-if="name === 'clothing'">
      <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path>
    </g>

    <!-- Дефолтная заглушка (круг) -->
    <circle v-else cx="12" cy="12" r="10"></circle>
  </svg>
</template>

<script setup vain>
defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: 24
  }
})
</script>