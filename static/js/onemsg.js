//rewrite

const PFP_LIST = [
	'af.png', 'alula_gasp2.png', 'alula_gasp.png', 'alula_oh.png', 'alula.png', 'alula_pout.png', 'alula_speak.png', 'blue_gatekeeper.png', 'bookbot.png', 'calamus_heh.png', 'calamus.png', 'calamus_sad.png', 'calamus_shame.png', 'calamus_shock.png', 'calamus_smile2.png', 'calamus_smile.png', 'calamus_speak.png', 'calamus_unknown.png', 'cedric2.png', 'cedric3.png', 'cedric4.png', 'cedric_eek.png', 'cedric_hmm.png', 'cedric.png', 'cedric_sigh2.png', 'cedric_sigh.png', 'cedric_smile.png', 'cedric_talk.png', 'cedric_upset.png', 'en2.png', 'en3.png', 'en4.png', 'en5.png', 'en6.png', 'en_83c.png', 'en_cry.png', 'en_distressed2.png', 'en_distressed_meow.png', 'en_distressed.png', 'en_distressed_talk.png', 'en_eyeclosed2.png', 'en_eyeclosed.png', 'en_gasmask.png', 'en_huh.png', 'en_less_sad.png', 'en_pancakes.png', 'en.png', 'en_sad.png', 'en_shock.png', 'en_smile.png', 'en_speak.png', 'en_surprised.png', 'en_upset2.png', 'en_upset_meow.png', 'en_upset.png', 'en_what2.png', 'en_what.png', 'en_wtf2.png', 'en_wtf.png', 'en_yawn.png', 'george1_hm.png', 'george1.png', 'george1_smile.png', 'george1_smug.png', 'george2_grr.png', 'george2_NO.png', 'george2.png', 'george2_sigh.png', 'george2_stress.png', 'george3_cry.png', 'george3.png', 'george3_sad.png', 'george3_sigh.png', 'george3_worry.png', 'george4_golly.png', 'george4_omg.png', 'george4_oops.png', 'george4.png', 'george4_smile.png', 'george5_aww.png', 'george5_heh.png', 'george5_hmm.png', 'george5.png', 'george5_sad.png', 'george5_sigh.png', 'george5_smile.png', 'george6_fingerguns.png', 'george6.png', 'george6_point.png', 'george6_shrug.png', 'george6_smile.png', 'green_gatekeeper.png', 'kelvin.png', 'kip2.png', 'kip_heh.png', 'kip_huh.png', 'kip.png', 'kip_pout.png', 'kip_sad.png', 'kip_sigh.png', 'kip_wink.png', 'kip_worry.png', 'ling2.png', 'ling3.png', 'ling_hm2.png', 'ling_hm.png', 'ling_oh.png', 'ling.png', 'ling_shock.png', 'ling_sigh.png', 'ling_smile.png', 'magpie_hm.png', 'magpie_oh.png', 'magpie.png', 'magpie_smile.png', 'maize.png', 'maize_smile1.png', 'maize_smile2.png', 'maize_strain.png', 'maize_stress.png', 'maize_thisisfine.png', 'mason.png', 'niko2.png', 'niko3.png', 'niko4.png', 'niko5.png', 'niko6.png', 'niko_83c.png', 'niko_cry.png', 'niko_distressed2.png', 'niko_distressed_meow.png', 'niko_distressed.png', 'niko_distressed_talk.png', 'niko_eyeclosed2.png', 'niko_eyeclosed.png', 'niko_gasmask.png', 'niko_huh.png', 'niko_less_sad.png', 'niko_pancakes.png', 'niko.png', 'niko_sad.png', 'niko_shock.png', 'niko_smile.png', 'niko_speak.png', 'niko_surprised.png', 'niko_upset2.png', 'niko_upset_meow.png', 'niko_upset.png', 'niko_what2.png', 'niko_what.png', 'niko_wtf2.png', 'niko_wtf.png', 'niko_yawn.png', 'plight_2b.png', 'plight_2.png', 'plight3.png', 'plight.png', 'plight_scared.png', 'plight_shock.png', 'plight_sigh.png', 'plight_unknown.png', 'plight_why.png', 'plight_worry2.png', 'plight_worry.png', 'plight_wtf.png', 'prophet_hmm.png', 'prophet_omg.png', 'prophet.png', 'prophet_sigh.png', 'proto1b.png', 'proto1c.png', 'proto1.png', 'proto2b.png', 'proto2.png', 'proto_disk.png', 'proto_eyeclosed.png', 'proto_gasp1.png', 'proto_gasp2.png', 'proto_jealous.png', 'red_gatekeeper.png', 'rowbot_off.png', 'rowbot.png', 'rue_dark.png', 'rue_oh.png', 'rue.png', 'rue_sad.png', 'rue_sigh.png', 'rue_smile.png', 'rue_talk.png', 'rue_ttt.png', 'shepherd.png', 'silver2.png', 'silver3.png', 'silver_eyeclosed.png', 'silver_falling.png', 'silver_GETOUT.png', 'silver_lookup.png', 'silver.png', 'silver_rip0.png', 'silver_rip2.png', 'silver_rip.png', 'silver_square1.png', 'silver_square2.png', 'silver_worry.png', 'watcher.png'
];

window.selectedPortrait = 'niko.png';

document.addEventListener('DOMContentLoaded', () => {
	const msgForm = document.getElementById('msgForm');
	const msgAuthor = document.getElementById('msgAuthor');
	const msgContent = document.getElementById('msgContent');
	const sendMsgBtn = document.getElementById('sendMsgBtn');
	const postFormContainer = document.getElementById('postFormContainer');
	const alreadyPostedNotice = document.getElementById('alreadyPostedNotice');
	const messagesStream = document.getElementById('messagesStream');
	const wallCount = document.getElementById('wallCount');
	const pfpSearch = document.getElementById('pfpSearch');

	const deviceFingerprint = getDeviceFingerprint();

	// rst.
	const savedUser = localStorage.getItem('kip_onemsg_username') || '';
	if (msgAuthor && savedUser) msgAuthor.value = savedUser;

	const clientLock = localStorage.getItem('has_sent_onemsg') || getCookie('has_sent_onemsg');

	loadMessages();

	if (msgForm) {
		msgForm.addEventListener('submit', async (e) => {
			e.preventDefault();

			const authorVal = msgAuthor.value.trim() || 'Anon';
			const contentVal = msgContent.value.trim();

			if (!contentVal) return alert('Please write a message!');

			sendMsgBtn.disabled = true;
			sendMsgBtn.textContent = 'Writing..';

			try {
				const res = await fetch('/api/onemsg/messages', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						author: authorVal,
						content: contentVal,
						portrait: window.selectedPortrait,
						fingerprint: deviceFingerprint
					})
				});

				const data = await res.json();

				if (res.ok) {
					localStorage.setItem('has_sent_onemsg', 'true');
					localStorage.setItem('kip_onemsg_username', authorVal);
					setCookie('has_sent_onemsg', 'true', 3650);

					if (postFormContainer) postFormContainer.style.display = 'none';
					if (alreadyPostedNotice) alreadyPostedNotice.style.display = 'block';
					loadMessages();
				} else {
					alert(data.error || 'Submission failed.');
				}
			} catch (err) {
				alert('Error submitting message: ' + err.message);
			} finally {
				sendMsgBtn.disabled = false;
				sendMsgBtn.textContent = 'Write your OneMessage';
			}
		});
	}

	async function loadMessages() {
		try {
			const res = await fetch(`/api/onemsg/messages?fp=${encodeURIComponent(deviceFingerprint)}`);
			if (!res.ok) return;

			const data = await res.json();
			if (wallCount) wallCount.textContent = data.totalCount || 0;

            if (data.hasPosted) {
                if (postFormContainer) postFormContainer.style.display = 'none';
                if (alreadyPostedNotice) alreadyPostedNotice.style.display = 'block';
            } else {
                // msg was deleted or user has not posted then unlock
                localStorage.removeItem('has_sent_onemsg');
                setCookie('has_sent_onemsg', '', -1);
                if (postFormContainer) postFormContainer.style.display = 'block';
                if (alreadyPostedNotice) alreadyPostedNotice.style.display = 'none';
            }

			const msgs = data.messages || [];
			if (!msgs.length) {
				messagesStream.innerHTML = '<p style="color: #aaa;">No messages yet. Be the first!</p>';
				return;
			}

			messagesStream.innerHTML = msgs.map(m => `
				<div class="msg-card">
					<img src="static/pfp/${escapeHTML(m.portrait)}" class="msg-pfp" alt="PFP" onerror="this.src='static/pfp/niko.png'">
					<div class="msg-body">
						<div class="msg-header">
							<div>
								<strong style="color: var(--header-subtitle); font-size: 13pt;">${escapeHTML(m.author)}</strong>
								<span class="msg-badge">OneMessage #${String(m.msg_number).padStart(3, '0')}</span>
							</div>
							<span>${new Date(m.created_at).toLocaleString()}</span>
						</div>
						<div style="font-size: 13pt; color: #e0d0e0; white-space: pre-wrap; margin-bottom: 10px;">${escapeHTML(m.content)}</div>
						<div>
							<button class="react-btn" onclick="reactMessage('${m.id}', 'light')">💡 Give light (${m.lights_count || 0})</button>
							<button class="react-btn" onclick="reactMessage('${m.id}', 'pancake')">🥞 Give pancakes (${m.pancakes_count || 0})</button>
						</div>
					</div>
				</div>
			`).join('');

		} catch (e) {}
	}

	if (pfpSearch) {
		pfpSearch.addEventListener('input', (e) => {
			const query = e.target.value.toLowerCase().trim();
			const filtered = PFP_LIST.filter(file => file.toLowerCase().includes(query));
			renderPfpGrid(filtered);
		});
	}

	function getDeviceFingerprint() {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		ctx.textBaseline = 'top';
		ctx.font = "14px 'Arial'";
		ctx.textBaseline = 'alphabetic';
		ctx.fillStyle = '#f60';
		ctx.fillRect(125, 1, 62, 20);
		ctx.fillStyle = '#069';
		ctx.fillText('OneMessage_Device_Hash', 2, 15);
		
		const str = [
			canvas.toDataURL(),
			navigator.userAgent,
			navigator.language,
			screen.width + 'x' + screen.height,
			new Date().getTimezoneOffset()
		].join('___');

		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) - hash) + str.charCodeAt(i);
			hash |= 0;
		}
		return 'fp_' + Math.abs(hash).toString(16);
	}

	function setCookie(name, val, days) {
		const d = new Date();
		d.setTime(d.getTime() + (days*24*60*60*1000));
		document.cookie = `${name}=${val};expires=${d.toUTCString()};path=/`;
	}

	function getCookie(name) {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) return parts.pop().split(';').shift();
		return '';
	}

	function escapeHTML(str) {
		return String(str || '').replace(/[&<>"']/g, m => ({
			'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
		})[m]);
	}
});

window.openPfpModal = function() {
	const pfpModal = document.getElementById('pfpModal');
	if (pfpModal) {
		renderPfpGrid(PFP_LIST);
		pfpModal.style.display = 'flex';
	}
};

window.closePfpModal = function() {
	const pfpModal = document.getElementById('pfpModal');
	if (pfpModal) {
		pfpModal.style.display = 'none';
	}
};

window.selectPfp = function(filename) {
	const selectedPfpImg = document.getElementById('selectedPfpImg');
	window.selectedPortrait = filename;
	if (selectedPfpImg) selectedPfpImg.src = `static/pfp/${filename}`;
	window.closePfpModal();
};

//react func
window.reactMessage = async function(msgId, reaction) {
	const lastReact = parseInt(localStorage.getItem('last_react_time') || '0');
	const now = Date.now();
	if (now - lastReact < 3000) {
		const remaining = Math.ceil((3000 - (now - lastReact)) / 1000);
		return alert(`Please wait ${remaining} seconds before reacting again!`);
	}

	try {
		const res = await fetch('/api/onemsg/react', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ msgId, reaction })
		});

		if (res.ok) {
			localStorage.setItem('last_react_time', now.toString());
			await loadMessages();
		}
	} catch (e) {}
};

function renderPfpGrid(list) {
	const pfpGrid = document.getElementById('pfpGrid');
	if (!pfpGrid) return;
	pfpGrid.innerHTML = list.map(filename => `
		<img src="static/pfp/${filename}" class="pfp-item" title="${filename.replace('.png','')}" onclick="window.selectPfp('${filename}')">
	`).join('');
}