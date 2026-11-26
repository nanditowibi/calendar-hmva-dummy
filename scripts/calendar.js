// ================= KONFIGURASI GOOGLE CALENDAR API =================
const CALENDAR_CONFIG = {
  API_KEY: 'AIzaSyDvapjaSjq6WhfvdVjpNZUWfal2HVi11tM',
  CALENDAR_ID: '89231293ec38baad93e2c00c93255c7381dd4dd70e53761854c20c3ee23185da@group.calendar.google.com' 
};
// Contoh: hmvaui@gmail.com atau xyz@group.calendar.google.com

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let monthlyEvents = [];
let selectedDateStr = null;

const calMonthYear = document.getElementById('calMonthYear');
const calDays = document.getElementById('calDays');
const agendaList = document.getElementById('agendaList');
const agendaHeading = document.getElementById('agendaHeading');
const resetFilterBtn = document.getElementById('resetFilterBtn');

// Ambil data langsung dari Google Calendar API v3
async function fetchGoogleCalendarEvents(year, month) {
  agendaList.innerHTML = `<div class="status-box">Menyinkronkan jadwal dengan Google Calendar...</div>`;

  // Cek jika API Key belum diisi (tampilkan panduan singkat)
  if (CALENDAR_CONFIG.API_KEY.includes('TEMPEL_API_KEY')) {
    agendaList.innerHTML = `
      <div class="status-box">
        <strong>API Key & Calendar ID belum dikonfigurasi.</strong><br>
        Buka file <code>scripts/calendar.js</code> lalu masukkan API Key dan Calendar ID Google Calendar HMVA UI.
      </div>`;
    monthlyEvents = [];
    renderCalendarGrid();
    return;
  }

  const timeMin = new Date(year, month, 1, 0, 0, 0).toISOString();
  const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_CONFIG.CALENDAR_ID)}/events?` +
    new URLSearchParams({
      key: CALENDAR_CONFIG.API_KEY,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: 'true',
      orderBy: 'startTime'
    });

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Pastikan Kalender sudah diset ke Public dan API Key aktif.`);
    }
    const data = await response.json();
    monthlyEvents = data.items || [];
    renderCalendarGrid();
    renderAgendaList();
  } catch (error) {
    console.error('Gagal mengambil data kalender:', error);
    agendaList.innerHTML = `
      <div class="status-box" style="color: var(--color-red-main);">
        Gagal memuat jadwal: ${error.message}
      </div>`;
  }
}

// Helper format tanggal YYYY-MM-DD lokal
function getEventDateKey(event) {
  if (event.start.date) {
    return event.start.date; // Format all-day sudah YYYY-MM-DD
  }
  const dt = new Date(event.start.dateTime);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Render Kotak-Kotak Tanggal
function renderCalendarGrid() {
  calMonthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  calDays.innerHTML = '';

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();

  // Kotak kosong sebelum tanggal 1
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'cal-day empty';
    calDays.appendChild(emptyDiv);
  }

  // Kumpulkan tanggal yang memiliki agenda
  const eventDates = new Set(monthlyEvents.map(ev => getEventDateKey(ev)));

  for (let day = 1; day <= totalDays; day++) {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayDiv = document.createElement('div');
    dayDiv.className = 'cal-day';
    dayDiv.textContent = day;

    if (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    ) {
      dayDiv.classList.add('today');
    }

    if (selectedDateStr === dateKey) {
      dayDiv.classList.add('selected');
    }

    if (eventDates.has(dateKey)) {
      const dot = document.createElement('span');
      dot.className = 'event-dot';
      dayDiv.appendChild(dot);
    }

    dayDiv.addEventListener('click', () => {
      selectedDateStr = selectedDateStr === dateKey ? null : dateKey;
      renderCalendarGrid();
      renderAgendaList();
    });

    calDays.appendChild(dayDiv);
  }
}

// Render Daftar Agenda di Panel Kanan
function renderAgendaList() {
  const filtered = selectedDateStr
    ? monthlyEvents.filter(ev => getEventDateKey(ev) === selectedDateStr)
    : monthlyEvents;

  if (selectedDateStr) {
    const [y, m, d] = selectedDateStr.split('-');
    agendaHeading.textContent = `Agenda ${parseInt(d)} ${monthNames[parseInt(m) - 1]} ${y}`;
    resetFilterBtn.style.display = 'inline-block';
  } else {
    agendaHeading.textContent = `Agenda Bulan ${monthNames[currentMonth]}`;
    resetFilterBtn.style.display = 'none';
  }

  if (filtered.length === 0) {
    agendaList.innerHTML = `<div class="status-box">Tidak ada jadwal kegiatan pada periode ini.</div>`;
    return;
  }

  agendaList.innerHTML = filtered.map(ev => {
    const dateKey = getEventDateKey(ev);
    const [y, m, d] = dateKey.split('-');
    const formattedDate = `${parseInt(d)} ${monthNames[parseInt(m) - 1]} ${y}`;

    let timeText = 'Seharian (All Day)';
    if (ev.start.dateTime) {
      const startObj = new Date(ev.start.dateTime);
      const endObj = new Date(ev.end.dateTime);
      const opts = { hour: '2-digit', minute: '2-digit', hour12: false };
      timeText = `${startObj.toLocaleTimeString('id-ID', opts)} – ${endObj.toLocaleTimeString('id-ID', opts)} WIB`;
    }

    return `
      <div class="agenda-item">
        <div class="agenda-date">${formattedDate} • ${timeText}</div>
        <div class="agenda-title">${ev.summary || 'Kegiatan HMVA UI'}</div>
        <div class="agenda-meta">
          ${ev.location ? `<span>Lokasi: ${ev.location}</span>` : ''}
          ${ev.description ? `<span>${ev.description}</span>` : ''}
        </div>
        ${ev.htmlLink ? `<a href="${ev.htmlLink}" target="_blank" rel="noopener" class="agenda-link">Simpan ke Google Calendar &rarr;</a>` : ''}
      </div>
    `;
  }).join('');
}

// Navigasi Tombol Bulan
document.getElementById('prevMonthBtn').addEventListener('click', () => {
  selectedDateStr = null;
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  fetchGoogleCalendarEvents(currentYear, currentMonth);
});

document.getElementById('nextMonthBtn').addEventListener('click', () => {
  selectedDateStr = null;
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  fetchGoogleCalendarEvents(currentYear, currentMonth);
});

document.getElementById('todayBtn').addEventListener('click', () => {
  selectedDateStr = null;
  const now = new Date();
  currentMonth = now.getMonth();
  currentYear = now.getFullYear();
  fetchGoogleCalendarEvents(currentYear, currentMonth);
});

resetFilterBtn.addEventListener('click', () => {
  selectedDateStr = null;
  renderCalendarGrid();
  renderAgendaList();
});

// Jalankan pertama kali
fetchGoogleCalendarEvents(currentYear, currentMonth);