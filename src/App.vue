<template>
  <div class="app-container">
    <!-- 动态内容区：根据 currentTab 渲染对应的页面组件 -->
    <main class="app-content">
      <component :is="currentComponent" />
    </main>

    <!-- 底部毛玻璃导航栏 -->
    <nav class="app-tabbar">
      <div 
        v-for="tab in tabs" 
        :key="tab.key" 
        class="tab-item"
        :class="{ active: currentTab === tab.key }"
        @click="currentTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onMounted } from 'vue';
// 引入子页面组件
import ScheduleView from './components/ScheduleView.vue';
import TodoView from './components/TodoView.vue';
import ProfileView from './components/ProfileView.vue';

const tabs = [
  { key: 'schedule', label: '日程', icon: '📅' },
  { key: 'todo', label: '待办', icon: '📝' },
  { key: 'profile', label: '我的', icon: '👤' }
];
const currentTab = ref('schedule');

// 动态组件映射
const componentMap = {
  schedule: ScheduleView,
  todo: TodoView,
  profile: ProfileView
};
const currentComponent = computed(() => componentMap[currentTab.value]);

onMounted(() => {
  let meta = document.querySelector('meta[name="viewport"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'viewport'
    document.head.appendChild(meta)
  }
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
});
</script>

<style>
/* 全局重置，确保日历能撑满屏幕 */
body, html { touch-action: none; margin: 0; padding: 0; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
#app { height: 100%; overflow: hidden; }
</style>

<style scoped>
.app-container { display: flex; flex-direction: column; height: 100vh; width: 100vw; overflow: hidden; background-color: #ffffff; }

.app-navbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border-bottom: 1px solid rgba(0, 0, 0, 0.05); z-index: 100; }
.navbar-title { font-size: 18px; font-weight: 600; color: #333; }
.icon-btn { background: none; border: none; font-size: 20px; cursor: pointer; padding: 4px; color: #333; }

.app-content { flex: 1; overflow: hidden; position: relative; } /* 注意这里改为 overflow: hidden，让子页面自己处理滚动 */
.app-tabbar { display: flex; justify-content: space-around; align-items: center; padding: 8px 0; background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border-top: 1px solid rgba(0, 0, 0, 0.05); z-index: 100; }
.tab-item { display: flex; flex-direction: column; align-items: center; font-size: 12px; color: #999; cursor: pointer; transition: color 0.2s; }
.tab-item.active { color: #1677ff; }
.tab-icon { font-size: 22px; margin-top: 4px; margin-bottom: 2px; }
.tab-label { font-weight: 500; }
</style>