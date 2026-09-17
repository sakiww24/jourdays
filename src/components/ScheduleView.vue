<template>
  <div class="schedule-container">
    <!-- 顶部毛玻璃标题栏 -->
    <header class="app-navbar">
      <div class="navbar-left">
        <button class="icon-btn menu-btn">☰</button>
      </div>
      <div class="navbar-middle">
        {{ titleCurrentMonth }}月
        <button class="icon-btn last-week-btn" @click="switchWeekOrDay(-1)">&lt;</button>
        第{{ titleCurrentWeek }}周
        <button class="icon-btn next-week-btn" @click="switchWeekOrDay(1)">&gt;</button>
      </div>
      <div class="navbar-right">
        <button class="icon-btn today-btn" @click="goToday">今</button>
        <button class="icon-btn view-switcher" @click="toggleView">{{ currentView == 'timeGridWeek' ? '日视图' : '周视图' }}</button>
        <button class="icon-btn add-btn">+</button>
      </div>
    </header>
    <!-- 引入 FullCalendar 组件 -->
    <div ref="calendarWrap" class="calendar-wrap">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>
  </div>
</template>


<script setup>
import { reactive } from 'vue';
import { ref, onMounted, onUnmounted } from 'vue'
import { Gesture } from '@use-gesture/vanilla'
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // 后续拖拽需要
import zhCnLocale from '@fullcalendar/core/locales/zh-cn'

const calendarRef = ref(null);
const calendarWrap = ref(null);
const currentView = ref('timeGridWeek'); // 👈 追踪当前视图状态
const hasScrolled = ref(false); // 追踪是否已滚动到当前时间，避免切换视图时重复滚动

// 切换视图方法
const switchView = (viewName) => {
  if (currentView.value === viewName) return;
  currentView.value = viewName;
  calendarRef.value.getApi().changeView(viewName);
};
const toggleView = () => {
  const newView = currentView.value === 'timeGridWeek' ? 'timeGridDay' : 'timeGridWeek';
  switchView(newView);
};

const calendarOptions = reactive({
  /* 日历全局设置 */
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek', // 默认周视图
  headerToolbar: false,        // 隐藏自带丑陋的顶部工具栏
  height: '100%',              // 高度撑满父容器
  allDaySlot: true,
  slotMinTime: '06:00:00',     // 早上6点开始显示
  slotMaxTime: '24:00:00',     // 晚上12点结束显示
  nowIndicator: true,          // 显示当前时间红线
  scrollTimeReset: false, // 保留滚动位置，避免切换视图时跳回顶部

  /* 回调函数注册 */
  // 首次加载时滚动到当前时间，切换视图时更新标题
  viewDidMount: (arg) => {
    currentView.value = arg.view.type;
    if (!hasScrolled.value) {
      // 仅在首次加载时滚动到当前时间，避免切换视图时重复滚动
      hasScrolled.value = true;
      // 计算当前时间字符串，例如 "13:05:00"
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const currentTime = `${pad(now.getHours()-2)}:${pad(now.getMinutes())}:00`;
      // 初始化时滚动到当前时间
      arg.view.calendar.scrollToTime(currentTime);
    }
    updateTitle(arg.view.currentStart);
  },
  // 切换日期时更新标题
  datesSet: (arg) => {
    updateTitle(arg.start);
  },
  // 自定义列头样式：高亮今天
  dayHeaderDidMount: (arg) => {
    const d = arg.date;
    const now = new Date();

    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    arg.el.classList.toggle('today-col-header', isToday);
  },

  // 点击事件卡片主逻辑
  eventClick: (info) => {
    // 预留卡片详情展示
    alert(`点击了事件：${info.event.title}`);
  },
  
  // 模拟数据：展示层级堆叠效果
  events: [
    { title: '高数课程', start: new Date().setHours(9, 0), end: new Date().setHours(11, 30), backgroundColor: 'rgba(22, 119, 255, 0.8)' },
    { title: '小组讨论', start: new Date().setHours(10, 0), end: new Date().setHours(11, 0), backgroundColor: 'rgba(255, 133, 192, 0.8)' }, // 与高数重叠
    { title: '健身', start: new Date().setHours(18, 0), end: new Date().setHours(19, 30), backgroundColor: 'rgba(82, 196, 26, 0.8)' },
  ],
  
  /* 日程卡片格式设置 */
  // 允许日程块重叠显示
  eventOverlap: true,
  // 卡片外观
  eventBorderColor: 'transparent', // 事件边框透明，避免遮挡重叠效果
  // 卡片内容
  displayEventTime: false, // 仅显示标题，隐藏时间，避免视觉杂乱

  /* 表头语言与格式设置 */
  // 中文设置
  locale: zhCnLocale,
  // 列头格式设置
  dayHeaderContent: function(arg) {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return {html:`${weekdays[arg.date.getDay()]}<br>${arg.date.getDate()}`}
  },
  // 行头格式设置
  slotLabelFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
});


// 实现时间轴缩放手势（待定）和左右滑动切换周手势
let gesture = null; // 用于存储手势实例
const BASE_SLOT_HEIGHT = 30;
const currentScale = ref(1);

onMounted(() => {
  gesture = new Gesture(
    calendarWrap.value, 
    {
      /*onPinch: ({ delta, memo, cancel }) => {
        // memo 用于记录上一次的状态，避免每次从基准值重新计算
        if (!memo) memo = currentScale.value
        
        // delta[0] 是双指距离的变化量，除以灵敏度系数
        const sensitivity = 2
        let newScale = memo + delta[0] / sensitivity
        
        // 🔒 边界限制：防止缩放到极小或极大
        newScale = Math.max(0.5, Math.min(2, newScale))
        
        currentScale.value = newScale
        
        // 🎯 核心：直接修改 CSS 变量，而非操作 DOM 类名
        calendarWrap.value.style.setProperty(
          '--fc-timegrid-slot-height', 
          `${BASE_SLOT_HEIGHT * newScale}px`
        )
        
        return newScale // 返回给下一次 pinch 作为 memo
      },
      // 阻止浏览器默认的双指缩放页面行为
      pinch: { preventDefault: true },*/

      onDrag: ({ last, swipe, cancelled }) => {
        // 先确认能进这里：有日志说明手势通了
        // console.log('drag', last, swipe, cancelled)

        if (!last || cancelled) return

        if (swipe[0] === 1) {
          // 向右滑：上一周 / 上一天
          switchWeekOrDay(-1)
        } else if (swipe[0] === -1) {
          // 向左滑：下一周 / 下一天
          switchWeekOrDay(1)
        }
      },
    },
    {
      drag: {
        axis: 'x',        // 只认水平滑动
        threshold: 50,
        filterTaps: true, // 点击/轻点不误触发
      },
    // 不阻止默认行为，保留浏览器原生垂直滚动
    eventOptions: { passive: false },
  })
})

onUnmounted(() => {
  gesture?.destroy()
})


/* 周数与周切换、日切换逻辑 */
/* ===== 月份、周数计算与切换 ===== */
const titleCurrentWeek = ref(1);
const titleCurrentMonth = ref(new Date().getMonth() + 1);
const SEMESTER_START = new Date('2026-09-14');

// 获取某日期所在周的周一
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
// 计算学期内第几周
function getSemesterWeek(date) {
  const monday = getMonday(date);
  const startMonday = getMonday(SEMESTER_START);
  const diffWeeks = Math.floor((monday - startMonday) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(0, diffWeeks + 1);
}
// 更新标题显示的月份和周数
function updateTitle(viewStart) {
  if (currentView.value === 'timeGridWeek') {
    const monday = getMonday(viewStart);
    titleCurrentMonth.value = monday.getMonth() + 1;
    titleCurrentWeek.value = getSemesterWeek(monday);
  } else {
    titleCurrentMonth.value = viewStart.getMonth() + 1;
    titleCurrentWeek.value = getSemesterWeek(viewStart);
  }
}
// 周视图切周、日视图切天（FullCalendar 的 prev/next 自动按当前视图粒度切换）
const switchWeekOrDay = (direction) => {
  const api = calendarRef.value.getApi();
  direction > 0 ? api.next() : api.prev();
};
const goToday = () => {
  const api = calendarRef.value?.getApi();
  if (!api) return;
  api.today();
  // 可选：跳到今天后顺便滚到当前时间
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  api.scrollToTime(`${pad(now.getHours()-2)}:${pad(now.getMinutes())}:00`);
};

</script>


<style scoped>

.schedule-container {
  /* 改用 flex 撑满，比 height:100% 更可靠 */
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* 关键！允许 flex 子项收缩并触发内部滚动 */
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 0;
  box-sizing: border-box;
}
.calendar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 关键！允许 flex 子项收缩并触发内部滚动 */
  touch-action: pan-x pan-y; /* 阻止浏览器默认的双指缩放页面行为 */
  /* 实现缩放时间轴 */
  --fc-timegrid-slot-height: 30px; /* 每个时间格高度，按需调整 */
}
:deep(.fc-scroller){
  touch-action: pan-x pan-y;
}

/* 导航栏主要样式 */
.app-navbar {
  display: flex;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(15px); 
  -webkit-backdrop-filter: blur(15px); 
  border-bottom: 1px solid rgba(0, 0, 0, 0.05); 
  border-radius: 8px;
  z-index: 100;
  padding: 12px 16px;
  align-self: stretch;
  align-items: center;
  justify-content: space-between;
}
.navbar-middle { 
  display: flex;
  align-items: center;
  font-size: 22px; 
  font-weight: 600; 
  color: #333; 
}
.navbar-left, .navbar-right { display: flex; align-items: center; }
.icon-btn { 
  border-radius: 8px;
  background: none; 
  border: none; 
  padding: 4px 10px; 
  color: #333; 
}
/* 适配不同按钮大小 */
.menu-btn { font-size: 22px; }
.navbar-middle .icon-btn { font-size: 24px; }
.add-btn { font-size: 24px; }
.view-switcher, .today-btn {
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
}

/* ===== 覆盖 FullCalendar 默认样式，实现 iOS 毛玻璃风 ===== */
:deep(.fc) {
  /* 基础的样式修改 */
  --fc-page-bg-color: #ffffff;
  --fc-neutral-bg-color: #ffffff;
  --fc-border-color: #f0f0f0; /* 极淡的网格线 */
  --fc-timegrid-slot-border-color: #f0f0f0;
  --fc-today-bg-color: rgba(22, 119, 255, 0.03); /* 今天的背景色微蓝 */
  --fc-now-indicator-color: #ff4d4f;
}

:deep(.fc .fc-timegrid-slot) {
  height: var(--fc-timegrid-slot-height, 30px) !important; /* 默认约 60px，按需调整 */
  border-bottom: 1px dashed rgba(0,0,0,0.03) !important; /* 虚线网格 */
}

:deep(.fc .fc-timegrid-event) {
  border-radius: 8px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  backdrop-filter: blur(8px); /* 卡片自身的毛玻璃效果 */
  padding: 0px 3px;
  font-size: 13px;
  font-weight: 500;
  opacity: 0.95;
}

/* 处理重叠卡片的层级堆叠效果 */
:deep(.fc .fc-timegrid-event-harness-inset .fc-timegrid-event) {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border: 1px solid rgba(255,255,255,0.5);
}

:deep(.today-col-header) {
  background: rgba(22, 119, 255, 0.08);
}

/* 高亮今天的列头文字颜色和字体加粗 */
:deep(.today-col-header),
:deep(.today-col-header *) {
  color: #1677ff !important;
  font-weight: 700;
}

</style>
