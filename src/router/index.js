import { createRouter, createWebHistory } from 'vue-router';
import ScheduleView from '../components/ScheduleView.vue';
import TodoView from '../components/TodoView.vue';
import ProfileView from '../components/ProfileView.vue';

const routes = [
  { path: '/schedule', component: ScheduleView },
  { path: '/todo', component: TodoView },
  { path: '/profile', component: ProfileView },
  // 设置默认重定向
  { path: '/', redirect: '/schedule' },
  { path: '/index.html', redirect: '/schedule' }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;