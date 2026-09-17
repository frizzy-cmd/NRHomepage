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
			if (isManualClick) showAlert("Site is back online! Redirecting..", "message");
			window.location.href = 'index.html';
		} else {
			if (isManualClick) {
				showAlert("Site is offline. Check back soon!", "error");
			}
		}
	} catch (e) {
		if (isManualClick) {
			showAlert("fallback | Site is still offline", "error");
		}
	}
}

// choose between niko or cal&alula
document.addEventListener('DOMContentLoaded', function() {
	var whatImg = ['c2.png', 'c4.png', 'c5.png'];
	var chosenImg = whatImg[Math.floor(Math.random() * whatImg.length)];
	
	var theImg = document.querySelector('.alula-cal') || document.querySelector('.mascot-img') || document.querySelector('.mascot-left-img');
	if (theImg) {
		theImg.src = 'static/sitedown/' + chosenImg;
	}

	checkStatus(false);
});