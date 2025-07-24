// 일정 데이터 임시 저장
let schedules = [
  { id: 1, title: '과제 제출', description: '수학 과제', date: '2025-07-24', priority: 'high' },
  { id: 2, title: '팀 미팅', description: '프로젝트 논의', date: '2025-07-26', priority: 'medium' },
];

const scheduleList = document.getElementById('schedule-list');
const form = document.getElementById('schedule-form');
const titleInput = document.getElementById('schedule-title');
const descInput = document.getElementById('schedule-desc');
const dateInput = document.getElementById('schedule-date');
const priorityInput = document.getElementById('schedule-priority');
const submitBtn = document.getElementById('schedule-submit');
let editId = null;

function renderSchedules() {
  if (!scheduleList) return;
  scheduleList.innerHTML = '';
  schedules.forEach(sch => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${sch.title}</strong> (${sch.date})<br>
      <span>${sch.description}</span><br>
      <span class="tag ${sch.priority}">${sch.priority}</span>
      <button onclick="editSchedule(${sch.id})">수정</button>
      <button onclick="deleteSchedule(${sch.id})">삭제</button>
    `;
    scheduleList.appendChild(li);
  });
}

window.editSchedule = function(id) {
  const sch = schedules.find(s => s.id === id);
  if (!sch) return;
  titleInput.value = sch.title;
  descInput.value = sch.description;
  dateInput.value = sch.date;
  priorityInput.value = sch.priority;
  editId = id;
  submitBtn.textContent = '수정 저장';
}

const calendarView = document.querySelector('.calendar-view');

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return { firstDay, lastDay, days: lastDay.getDate() };
}

// 날짜 선택 상태
let selectedDate = new Date(currentYear, currentMonth, 1);

// 1. 달력에서 날짜 클릭 시 일간 뷰로 이동 및 해당 날짜 선택
function onCalendarDayClick(date) {
  selectedDate = new Date(date);
  currentView = 'day';
  refreshCalendar();
  if (viewSelect) viewSelect.value = '일간';
}

// 2. 주간 뷰: 현재 선택된 날짜 기준 주간 표시
function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function renderCalendar(year, month) {
  if (!calendarView) return;
  calendarView.innerHTML = '';
  const { firstDay, lastDay, days } = getMonthDays(year, month);
  const startDay = firstDay.getDay();
  const table = document.createElement('table');
  table.className = 'calendar-table';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>일</th><th>월</th><th>화</th><th>수</th><th>목</th><th>금</th><th>토</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  let tr = document.createElement('tr');
  for (let i = 0; i < startDay; i++) {
    tr.appendChild(document.createElement('td'));
  }
  for (let d = 1; d <= days; d++) {
    const td = document.createElement('td');
    td.className = 'calendar-day';
    const dateObj = new Date(year, month, d);
    td.innerHTML = `<div class="date-num">${d}</div>`;
    // 일정 표시
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const daySchedules = schedules.filter(s => s.date === dateStr);
    daySchedules.forEach(sch => {
      const ev = document.createElement('div');
      ev.className = `calendar-event ${sch.priority}`;
      ev.textContent = sch.title;
      // 4. 일정 상세/수정 바로가기
      ev.style.cursor = 'pointer';
      ev.onclick = () => editSchedule(sch.id);
      td.appendChild(ev);
    });
    // 3. 날짜 클릭 시 일간 뷰 이동
    td.style.cursor = 'pointer';
    td.onclick = () => onCalendarDayClick(dateObj);
    // 오늘 표시
    const today = new Date();
    if (dateObj.toDateString() === today.toDateString()) {
      td.style.background = '#e6fffa';
    }
    // 선택된 날짜 표시
    if (dateObj.toDateString() === selectedDate.toDateString()) {
      td.style.outline = '2px solid #3182ce';
    }
    tr.appendChild(td);
    if ((startDay + d) % 7 === 0 || d === days) {
      tbody.appendChild(tr);
      tr = document.createElement('tr');
    }
  }
  table.appendChild(tbody);
  calendarView.appendChild(table);
}

// 월/연도 상태
let currentYear = 2025;
let currentMonth = 6; // 0-indexed (7월)
let currentView = 'month'; // 'month' | 'week' | 'day'

function updateCalendarLabel() {
  const label = document.querySelector('.calendar-controls span');
  if (label) label.textContent = `${currentYear}년 ${currentMonth+1}월`;
}

function renderWeekCalendar(year, month, weekStartDate) {
  if (!calendarView) return;
  calendarView.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'calendar-table';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>일</th><th>월</th><th>화</th><th>수</th><th>목</th><th>금</th><th>토</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  const tr = document.createElement('tr');
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + i);
    const td = document.createElement('td');
    td.className = 'calendar-day';
    td.innerHTML = `<div class="date-num">${date.getDate()}</div>`;
    // 일정 표시
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const daySchedules = schedules.filter(s => s.date === dateStr);
    daySchedules.forEach(sch => {
      const ev = document.createElement('div');
      ev.className = `calendar-event ${sch.priority}`;
      ev.textContent = sch.title;
      ev.style.cursor = 'pointer';
      ev.onclick = () => editSchedule(sch.id);
      td.appendChild(ev);
    });
    // 날짜 클릭 시 일간 뷰 이동
    td.style.cursor = 'pointer';
    td.onclick = () => onCalendarDayClick(date);
    // 오늘 표시
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      td.style.background = '#e6fffa';
    }
    // 선택된 날짜 표시
    if (date.toDateString() === selectedDate.toDateString()) {
      td.style.outline = '2px solid #3182ce';
    }
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
  table.appendChild(tbody);
  calendarView.appendChild(table);
}

function renderDayCalendar(year, month, day) {
  if (!calendarView) return;
  calendarView.innerHTML = '';
  const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const daySchedules = schedules.filter(s => s.date === dateStr);
  const h2 = document.createElement('h2');
  h2.textContent = `${year}년 ${month+1}월 ${day}일 일정`;
  calendarView.appendChild(h2);
  if (daySchedules.length === 0) {
    const p = document.createElement('p');
    p.textContent = '일정이 없습니다.';
    calendarView.appendChild(p);
  } else {
    const ul = document.createElement('ul');
    daySchedules.forEach(sch => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${sch.title}</strong> <span class="tag ${sch.priority}">${sch.priority}</span><br>${sch.description}`;
      // 4. 일정 상세/수정 바로가기
      li.style.cursor = 'pointer';
      li.onclick = () => editSchedule(sch.id);
      ul.appendChild(li);
    });
    calendarView.appendChild(ul);
  }
}

function refreshCalendar() {
  if (currentView === 'month') {
    renderCalendar(currentYear, currentMonth);
    updateCalendarLabel();
  } else if (currentView === 'week') {
    // 2. 주간 뷰: 현재 선택된 날짜 기준 주간 표시
    const weekStart = getWeekStart(selectedDate);
    renderWeekCalendar(weekStart.getFullYear(), weekStart.getMonth(), weekStart);
    const label = document.querySelector('.calendar-controls span');
    if (label) {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      label.textContent = `${weekStart.getFullYear()}년 ${weekStart.getMonth()+1}월 ${weekStart.getDate()}일 ~ ${end.getFullYear()}년 ${end.getMonth()+1}월 ${end.getDate()}일`;
    }
  } else if (currentView === 'day') {
    renderDayCalendar(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const label = document.querySelector('.calendar-controls span');
    if (label) label.textContent = `${selectedDate.getFullYear()}년 ${selectedDate.getMonth()+1}월 ${selectedDate.getDate()}일`;
  }
}

// 뷰 전환 select 이벤트: 선택 날짜를 현재 월 1일로 초기화
if (viewSelect) {
  viewSelect.onchange = function() {
    currentView = viewSelect.value === '월간' ? 'month' : viewSelect.value === '주간' ? 'week' : 'day';
    if (currentView === 'month') {
      selectedDate = new Date(currentYear, currentMonth, 1);
    }
    refreshCalendar();
  };
}

document.addEventListener('DOMContentLoaded', () => {
  renderSchedules();
  refreshCalendar();
});

// 일정 추가/수정/삭제 시 달력도 갱신
function rerenderAll() {
  renderSchedules();
  refreshCalendar();
}

// 기존 renderSchedules 호출 부분을 rerenderAll로 변경
if (form) {
  form.onsubmit = function(e) {
    e.preventDefault();
    const data = {
      title: titleInput.value,
      description: descInput.value,
      date: dateInput.value,
      priority: priorityInput.value,
    };
    if (editId) {
      schedules = schedules.map(s => s.id === editId ? { ...s, ...data } : s);
      editId = null;
      submitBtn.textContent = '등록';
    } else {
      schedules.push({ ...data, id: Date.now() });
    }
    rerenderAll();
    form.reset();
  }
}
window.deleteSchedule = function(id) {
  schedules = schedules.filter(s => s.id !== id);
  rerenderAll();
  form.reset();
  submitBtn.textContent = '등록';
  editId = null;
}
// 월 이동 버튼: 월간 뷰에서는 월 이동, 주간/일간 뷰에서는 선택 날짜 이동
if (prevBtn && nextBtn) {
  prevBtn.onclick = () => {
    if (currentView === 'month') {
      if (currentMonth === 0) {
        currentYear--;
        currentMonth = 11;
      } else {
        currentMonth--;
      }
      selectedDate = new Date(currentYear, currentMonth, 1);
    } else {
      // 주간/일간: 선택 날짜 -7일/-1일
      selectedDate.setDate(selectedDate.getDate() - (currentView === 'week' ? 7 : 1));
      currentYear = selectedDate.getFullYear();
      currentMonth = selectedDate.getMonth();
    }
    refreshCalendar();
  };
  nextBtn.onclick = () => {
    if (currentView === 'month') {
      if (currentMonth === 11) {
        currentYear++;
        currentMonth = 0;
      } else {
        currentMonth++;
      }
      selectedDate = new Date(currentYear, currentMonth, 1);
    } else {
      // 주간/일간: 선택 날짜 +7일/+1일
      selectedDate.setDate(selectedDate.getDate() + (currentView === 'week' ? 7 : 1));
      currentYear = selectedDate.getFullYear();
      currentMonth = selectedDate.getMonth();
    }
    refreshCalendar();
  };
} 