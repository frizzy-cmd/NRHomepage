// admin.js - For admin.html

document.addEventListener('DOMContentLoaded', () => {
	const loginGate = document.getElementById('loginGate');
	const adminPasswordInput = document.getElementById('adminPasswordInput');
	const loginBtn = document.getElementById('loginBtn');
	const adminDashboard = document.getElementById('adminDashboard');

	const modModal = document.getElementById('modModal');
	const modModalTarget = document.getElementById('modModalTarget');
	const modActionType = document.getElementById('modActionType');
	const modReasonInput = document.getElementById('modReasonInput');
	const modDurationInput = document.getElementById('modDurationInput');
	const confirmModBtn = document.getElementById('confirmModBtn');
	const cancelModBtn = document.getElementById('cancelModBtn');

	let currentTargetIp = '';
	let currentTargetUser = '';

	// if pw in sessionstorage = login no pw
	let adminToken = sessionStorage.getItem('kip_admin_token') || '';
	if (adminToken) {
		fetchStats(adminToken);
	}

	loginBtn.addEventListener('click', () => {
		const pwd = adminPasswordInput.value.trim();
		if (!pwd) return;
		sessionStorage.setItem('kip_admin_token', pwd);
		fetchStats(pwd);
	});

	async function fetchStats(pwd) {
		try {
			const res = await fetch('/api/admin/stats', {
				headers: { 'X-Admin-Key': pwd }
			});

			if (!res.ok) {
				alert('Invalid password. Try again.');
				sessionStorage.removeItem('kip_admin_token');
				return;
			}

			const data = await res.json();
			loginGate.style.display = 'none';
			adminDashboard.style.display = 'block';

			// statistics
			document.getElementById('statActivePosts').textContent = data.stats.activePosts;
			document.getElementById('statActiveComments').textContent = data.stats.activeComments;
			document.getElementById('statTotalCombined').textContent = data.stats.totalCombined;
			document.getElementById('statBans').textContent = data.stats.bans;
			document.getElementById('statMutes').textContent = data.stats.mutes;
			document.getElementById('statKicks').textContent = data.stats.kicks;

			// audit log
			renderAuditLog(data.auditLog || []);

			// active usrs
			renderActiveUsers(data.activeUsers || []);

			// past usr
			renderPastUsers(data.auditLog || []);

		} catch (e) {
			alert('Failed to auth to admin API: ' + e.message);
		}
	}

    // render audit log entries
	function renderAuditLog(logs) {
		const container = document.getElementById('auditLogList');
		if (!logs.length) { container.innerHTML = '<p style="color:#aaa;">No audit logs yet.</p>'; return; }

		container.innerHTML = logs.map(l => `
			<div class="audit-row">
				<span>Kip <strong>${l.action_type.toUpperCase()}ED</strong> ${escapeHTML(l.username || 'User')} for: <em>"${escapeHTML(l.reason)}"</em></span>
				<span style="color:#888;">${new Date(l.created_at).toLocaleString()}</span>
			</div>
		`).join('');
	}

    // render act users entries
	function renderActiveUsers(users) {
		const container = document.getElementById('activeUsersList');
		if (!users.length) { container.innerHTML = '<p style="color:#aaa;">No active users.</p>'; return; }

		container.innerHTML = users.map(u => `
			<div class="user-row">
				<span><strong>${escapeHTML(u.author)}</strong> | Hash: <code>${u.ip_hash}</code></span>
				<button class="mod-btn" onclick="openModModal('${u.ip_hash}', '${escapeHTML(u.author)}')">Moderate</button>
			</div>
		`).join('');
	}

    // i dont need to explain this do i?
	function renderPastUsers(logs) {
		const container = document.getElementById('pastUsersList');
		const past = logs.filter(l => l.action_type === 'ban' || l.action_type === 'mute');
		if (!past.length) { container.innerHTML = '<p style="color:#aaa;">No active bans/mutes</p>'; return; }

		container.innerHTML = past.map(l => `
			<div class="user-row">
				<span><strong>${escapeHTML(l.username)}</strong> | Type: <strong>${l.action_type.toUpperCase()}</strong> | Reason: ${escapeHTML(l.reason)}</span>
				<button class="revoke-btn" onclick="revokeMod('${l.id}')">Revoke</button>
			</div>
		`).join('');
	}

	window.openModModal = function(ipHash, username) {
		currentTargetIp = ipHash;
		currentTargetUser = username;
		modModalTarget.textContent = `Target: ${username} (${ipHash})`;
		modModal.style.display = 'flex';
	};

	cancelModBtn.addEventListener('click', () => {
		modModal.style.display = 'none';
	});

	confirmModBtn.addEventListener('click', async () => {
		const action = modActionType.value;
		const reason = modReasonInput.value.trim() || 'Rule violation';
		const duration = parseInt(modDurationInput.value) || 24;
		const pwd = sessionStorage.getItem('kip_admin_token');

		try {
			const res = await fetch('/api/admin/moderate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Admin-Key': pwd
				},
				body: JSON.stringify({
					action,
					ipHash: currentTargetIp,
					username: currentTargetUser,
					reason,
					durationHours: duration
				})
			});

			if (res.ok) {
				modModal.style.display = 'none';
				fetchStats(pwd); // ref db
			} else {
				alert('Action failed!');
			}
		} catch (e) {
			alert('Error executing moderation: ' + e.message);
		}
	});

	window.revokeMod = async function(modId) {
		const pwd = sessionStorage.getItem('kip_admin_token');
		if (!confirm('Are you sure you want to revoke this punishment?')) return;

		try {
			const res = await fetch('/api/admin/moderate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Admin-Key': pwd
				},
				body: JSON.stringify({ action: 'revoke', targetId: modId })
			});

			if (res.ok) fetchStats(pwd);
		} catch (e) {
			alert('failed to revoke...: ' + e.message);
		}
	};

	function escapeHTML(str) {
		return String(str || '').replace(/[&<>"']/g, m => ({
			'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
		})[m]);
	}
});