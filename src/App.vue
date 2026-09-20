<template>
  <!-- 根容器，整个页面样式 -->
  <div class="flex flex-col h-[100%] w-screen overflow-hidden bg-white text-gray-900 font-sans">
    <!-- 动态内容区：根据 currentTab 渲染对应的页面组件 -->
    <router-view class="flex-1 overflow-hidden relative w-full h-full" />

    <!-- 底部毛玻璃导航栏 -->
    <van-tabbar
      v-model="$route.path"
      :fixed="false"
      safe-area-inset-bottom
      active-color="#2563eb"
      inactive-color="#6b7280"
      class="bg-white/45 backdrop-blur-md pt-2"
    >
      <van-tabbar-item
        v-for="tab in tabs"
        :key="tab.path"
        :name="tab.path"
        :to="tab.path"
        class="text-current"
      >
        <template #icon>
          <span
            v-html="tab.iconPath"
            class="block w-6 h-6"
          ></span>
        </template>
        {{ tab.label }}
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
const tabs = [
  { 
    key: 'schedule', 
    path: '/schedule',
    label: '日程', 
    iconPath: '<svg stroke="currentColor" width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 19H43V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V19Z" fill="none" stroke-width="4" stroke-linejoin="round"/><path d="M5 9C5 7.89543 5.89543 7 7 7H41C42.1046 7 43 7.89543 43 9V19H5V9Z" stroke-width="4" stroke-linejoin="round"/><path d="M16 4V12" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 4V12" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 34H34" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 34H20" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 26H34" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 26H20" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  { 
    key: 'todo', 
    path: '/todo',
    label: '待办', 
    iconPath: '<svg stroke="currentColor" width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#icon-0e869f5353e4f38)"><path d="M42 20V39C42 40.6569 40.6569 42 39 42H9C7.34315 42 6 40.6569 6 39V9C6 7.34315 7.34315 6 9 6H30" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 20L26 28L41 7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g><defs><clipPath id="icon-0e869f5353e4f38"><rect width="48" height="48"/></clipPath></defs></svg>' 
  },
  { 
    key: 'profile', 
    path: '/profile',
    label: '我的', 
    iconPath: '<svg stroke="currentColor" width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 23C26.7614 23 29 20.7614 29 18C29 15.2386 26.7614 13 24 13C21.2386 13 19 15.2386 19 18C19 20.7614 21.2386 23 24 23Z" fill="none" stroke-width="4" stroke-linejoin="round"/><path d="M10.022 38.332C10.3657 33.1206 14.7016 29 20 29H28C33.2914 29 37.6229 33.1097 37.9767 38.3113" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  }
];
</script>

<style>
/* 全局重置，确保日历能撑满屏幕 */
body, html { 
  touch-action: none; 
  margin: 0; 
  height: 100%; 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
}
#app { 
  height: 100%; 
  overflow: hidden; 
}
</style>

<style scoped>
.app-content { flex: 1; overflow: hidden; position: relative; } /* 注意这里改为 overflow: hidden，让子页面自己处理滚动 */
</style>