document.addEventListener('DOMContentLoaded', () => {
  const adminLoginSection = document.getElementById('admin-login-section');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminLoginStatus = document.getElementById('admin-login-status');
  const dashboardSection = document.getElementById('admin-dashboard');
  const studentsTable = document.getElementById('students-table');
  const stats = document.getElementById('stats');
  const searchInput = document.getElementById('search');

  let token = localStorage.getItem('adminToken') || '';
  let students = [];

  function setStatus(el, msg, type='') {
    if (!el) return;
    el.textContent = msg;
    el.className = `status ${type}`.trim();
  }

  function renderTable(list) {
    if (!list || list.length === 0) {
      studentsTable.innerHTML = '<p>No data.</p>';
      stats.textContent = '';
      return;
    }

    const total = list.length;
    const completed = list.filter(s => s.completed).length;
    const avgScore = (list.filter(s => typeof s.score === 'number').reduce((a, b) => a + (b.score || 0), 0) / Math.max(1, list.filter(s => typeof s.score === 'number').length)).toFixed(2);
    stats.textContent = `Total: ${total} | Completed: ${completed} | Avg Score: ${isNaN(avgScore) ? '-' : avgScore}`;

    const rows = list.map(s => `
      <tr>
        <td>${s.grade_level ?? ''}</td>
        <td>${s.class_name ?? ''}</td>
        <td>${s.nickname ?? ''}</td>
        <td>${s.student_id ?? ''}</td>
        <td>${s.score ?? ''}</td>
        <td>${s.completed ? 'Yes' : 'No'}</td>
        <td>${s.submitted_at ? new Date(s.submitted_at).toLocaleString() : ''}</td>
      </tr>
    `).join('');

    studentsTable.innerHTML = `
      <div style="overflow:auto;">
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align:left; border-bottom:1px solid #ddd;">Grade</th>
              <th style="text-align:left; border-bottom:1px solid #ddd;">Class</th>
              <th style="text-align:left; border-bottom:1px solid #ddd;">Nickname</th>
              <th style="text-align:left; border-bottom:1px solid #ddd;">Student ID</th>
              <th style="text-align:left; border-bottom:1px solid #ddd;">Score</th>
              <th style="text-align:left; border-bottom:1px solid #ddd;">Completed</th>
              <th style="text-align:left; border-bottom:1px solid #ddd;">Submitted At</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  async function fetchDashboard() {
    setStatus(adminLoginStatus, '');
    try {
      const res = await fetch('/.netlify/functions/getAdminDashboard', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      students = data.students || [];
      renderTable(students);
    } catch (e) {
      setStatus(adminLoginStatus, e.message || 'Failed to load dashboard', 'error');
    }
  }

  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(adminLoginStatus, 'Logging in...');
    try {
      const username = (document.getElementById('admin-username').value || '').trim();
      const password = (document.getElementById('admin-password').value || '').trim();
      const res = await fetch('/.netlify/functions/adminLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Login failed');
      token = data.token;
      localStorage.setItem('adminToken', token);
      adminLoginSection.style.display = 'none';
      dashboardSection.style.display = 'block';
      setStatus(adminLoginStatus, '');
      await fetchDashboard();
    } catch (e) {
      setStatus(adminLoginStatus, e.message || 'Login failed', 'error');
    }
  });

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    const filtered = students.filter(s =>
      (s.nickname || '').toLowerCase().includes(q) ||
      (s.class_name || '').toLowerCase().includes(q) ||
      (s.student_id || '').toLowerCase().includes(q)
    );
    renderTable(filtered);
  });

  // Auto-restore if token exists
  if (token) {
    adminLoginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    fetchDashboard();
  }
});


