// check-status.js
async function checkStatus(isManualClick) {
	try {
		const res = await fetch('/api/site/status');
		const data = await res.json();

		const noteText = document.getElementById('adminNoteText');
		const noteBox = document.getElementById('adminNoteBox');

		if (data.note && noteText && noteBox) {
			noteText.textContent = data.note;
			noteBox.style.display = 'block';
		}

		if (data.status === 'online') {
			if (isManualClick) alert('Site is back online! Redirecting...');
			window.location.href = 'index.html';
		} else {
			if (isManualClick) {
				alert('Site is still undergoing maintenance. Please check back soon!');
			}
		}
	} catch (e) {
		if (isManualClick) {
			alert('Site is currently offline.');
		}
	}
}

document.addEventListener('DOMContentLoaded', function() {
	checkStatus(false);
});