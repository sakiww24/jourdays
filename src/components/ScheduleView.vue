<template>
  <div class="flex flex-col flex-1 min-h-0 w-full h-full overflow-auto p-0 box-border">
    
    <!-- 顶部毛玻璃标题栏 -->
    <header class="flex self-stretch bg-white/45 backdrop-blur-[15px] border-b border-black/5 rounded-xl z-[100] py-2 px-4 items-center justify-between touch-action-none">
      
      <div class="flex items-center gap-1">
        <button class="header-btn" @click="popupMenu">
          <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.94971 11.9497H39.9497" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.94971 23.9497H39.9497" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.94971 35.9497H39.9497" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>

      <div class="flex items-center gap-1 text-[22px] font-bold text-gray-800">
        {{ titleCurrentMonth }}月
        <button class="header-btn" @click="switchWeekOrDay(-1)">&lt;</button>
        第{{ titleCurrentWeek }}周
        <button class="header-btn" @click="switchWeekOrDay(1)">&gt;</button>
      </div>

      <div class="flex items-center gap-1">
        <button class="header-btn text-[16px]" @click="goToday">今</button>
        <button class="header-btn text-[16px]" @click="toggleView">{{ currentView == 'timeGridWeek' ? '日' : '周' }}</button>
        <button class="header-btn" @click="triggerAddEvent">
          <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M24 16V32" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 24L32 24" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>

    </header>

    <!-- 引入 FullCalendar 组件 -->
    <div ref="calendarWrap" class="calendar-wrap">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>

  </div>

  <van-popup
    v-model:show="showAddEvent"
    position="bottom"
    round
    teleport="body"
    close-on-click-overlay
    :style="{ maxHeight: '82%' }"
  >
    <div class="p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
      <div class="text-lg font-bold mb-3">添加日程</div>

      <!-- 日程类型 -->
      <div class="mb-3">
        <div class="text-sm text-gray-500 mb-2">类型</div>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="t in eventTypes"
            :key="t.value"
            class="type-btn"
            :class="{ active: form.type === t.value }"
            @click="form.type = t.value"
          >
            {{ t.label }}
          </button>
        </div>
      </div>

      <van-field
        v-model="form.title"
        label="标题"
        placeholder="例如：高数课程"
        required
        clearable
      />

      <van-field label="日期">
        <template #input>
          <input
            v-model="form.date"
            type="date"
            class="w-full bg-transparent outline-none"
          >
        </template>
      </van-field>

      <!-- 时间段：开始 + 结束 -->
      <div v-if="form.type === 'range'" class="grid grid-cols-2 gap-2 px-4 py-2">
        <div>
          <div class="text-xs text-gray-400 mb-1">开始</div>
          <input v-model="form.startTime" type="time" class="time-input">
        </div>
        <div>
          <div class="text-xs text-gray-400 mb-1">结束</div>
          <input v-model="form.endTime" type="time" class="time-input">
        </div>
      </div>

      <!-- 时间点：只选一个时间 -->
      <div v-else-if="form.type === 'point'" class="px-4 py-2">
        <div class="text-xs text-gray-400 mb-1">时间</div>
        <input v-model="form.startTime" type="time" class="time-input">
      </div>

      <!-- 全天：不显示时间输入 -->
      <div v-else class="px-4 py-2 text-sm text-gray-400">
        全天日程只需选择日期
      </div>

      <!-- 颜色 -->
      <div class="px-4 py-2">
        <div class="text-sm text-gray-500 mb-2">颜色</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="c in eventColors"
            :key="c"
            class="h-8 w-8 rounded-full border"
            :style="{
              background: c,
              borderColor: form.color === c ? '#333' : 'rgba(0,0,0,0.08)'
            }"
            @click="form.color = c"
          />
        </div>
      </div>

      <van-field v-model="form.location" label="地点" placeholder="可选" clearable />
      <van-field
        v-model="form.description"
        label="备注"
        type="textarea"
        rows="2"
        placeholder="可选"
      />

      <div class="flex gap-2 mt-4">
        <van-button round block @click="showAddEvent = false">取消</van-button>
        <van-button round block type="primary" @click="submitEvent">保存</van-button>
      </div>
    </div>
  </van-popup>
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

// 日历配置
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
    // 弹出一个详情框
    
  },
  
  /* 日程卡片格式设置 */
  eventOverlap: true,
  eventBorderColor: 'transparent', // 事件边框透明，避免遮挡重叠效果
  displayEventTime: false, // 仅显示标题，隐藏时间，避免视觉杂乱
  // 时间点事件的设置
  defaultTimedEventDuration: '00:25:00',
  forceEventDuration: false,

  /* 表头语言与格式设置 */
  // 中文设置
  locale: zhCnLocale,
  // 列头格式设置
  dayHeaderContent: function(arg) {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return {html:`<span class="text-[12px] font-normal">${weekdays[arg.date.getDay()]}</span><br><span class="text-[18px] font-normal">${arg.date.getDate()}</span>`}
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

// 日程事件相关逻辑
const showAddEvent = ref(false);
const eventTypes = [
  { label: '全天', value: 'allday' },
  { label: '时间段', value: 'range' },
  { label: '时间点', value: 'point' },
]

// 淡一点的颜色，适合毛玻璃卡片
const eventColors = [
  'rgba(22, 119, 255, 0.45)',
  'rgba(255, 133, 192, 0.45)',
  'rgba(82, 196, 26, 0.45)',
  'rgba(250, 173, 20, 0.45)',
  'rgba(114, 46, 209, 0.40)',
  'rgba(19, 194, 194, 0.40)',
]

const pad = (n) => String(n).padStart(2, '0')

function randomColor() {
  return eventColors[Math.floor(Math.random() * eventColors.length)]
}

function defaultForm() {
  const now = new Date()
  const later = new Date(now.getTime() + 60 * 60 * 1000)

  return {
    title: '',
    type: 'range', // allday | range | point
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    startTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    endTime: `${pad(later.getHours())}:${pad(later.getMinutes())}`,
    location: '',
    description: '',
    color: randomColor(), // 初始随机淡色
  }
}

const form = ref(defaultForm())

function submitEvent() {
  if (!form.value.title.trim()) {
    showToast?.('请填写标题')
    return
  }

  const api = calendarRef.value?.getApi()
  if (!api) return

  const baseEvent = {
    id: String(Date.now()),
    title: form.value.title.trim(),
    backgroundColor: form.value.color,
    borderColor: 'transparent',
    extendedProps: {
      location: form.value.location,
      description: form.value.description,
      kind: form.value.type,
    },
  }

  if (form.value.type === 'allday') {
    api.addEvent({
      ...baseEvent,
      allDay: true,
      start: form.value.date, // 全天建议用纯日期字符串
    })
  }

  if (form.value.type === 'range') {
    const start = new Date(`${form.value.date}T${form.value.startTime}:00`)
    let end = new Date(`${form.value.date}T${form.value.endTime}:00`)

    if (end <= start) {
      showToast?.('结束时间需要晚于开始时间')
      return
    }

    api.addEvent({
      ...baseEvent,
      allDay: false,
      start,
      end,
    })
  }

  if (form.value.type === 'point') {
    const start = new Date(`${form.value.date}T${form.value.startTime}:00`)

    // FullCalendar 对零时长事件展示不稳定，所以时间点也给一个很短的可视时长
    // 也可以做一个全局设置项
    api.addEvent({
      ...baseEvent,
      allDay: false,
      start,
      // end: new Date(start.getTime() + 15 * 60 * 1000),
      extendedProps: {
        ...baseEvent.extendedProps,
        pointTime: start.getTime(),
      },
    })
  }

  showAddEvent.value = false
}

function triggerAddEvent() {
  form.value = defaultForm();
  showAddEvent.value = true;
}

</script>


<style scoped>

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
  padding: 2px 3px;
  font-size: 11px;
  font-weight: 500;
  opacity: 0.95;
  color: black;
  line-height: 1.4;
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
