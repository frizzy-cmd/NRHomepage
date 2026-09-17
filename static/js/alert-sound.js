// alert-soumd.js (cust. error sounds for alert()

function playSound(type) {
	var soundMap = {
		'instruction': 'static/audioindex/me/instruction1.wav',
		'success': 'static/audioindex/se/pc_granted.wav',
		'error': 'static/audioindex/se/pc_denied.wav',
        'message': 'static/audioindex/se/pc_messagebox.wav'
	};

	var path = soundMap[type] || soundMap['instruction'];
	var sfx = new Audio(path);
	sfx.play().catch(function(e) {});
}

// showAlert("message", "audio");
function showAlert(message, soundType) {
	playSound(soundType || 'instruction');
	setTimeout(function() {
		alert(message);
	}, 60);
}

window.playSound = playSound;
window.showAlert = showAlert;

// examples:
// showAlert("Please enter your name!", "instruction");

// showAlert("Success!", "success");

// showAlert("Incorrect password!", "error");