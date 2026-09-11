// secret.... shsh..... i mean shh not shsh FUCK

var typedKeys = '';
var isTriggered = false;

document.addEventListener('keydown', function(e) {
	if (isTriggered) return;

	if (e.key && e.key.length === 1) {
		typedKeys += e.key.toLowerCase();
		if (typedKeys.length > 10) {
			typedKeys = typedKeys.substring(typedKeys.length - 10);
		}

		if (typedKeys.indexOf('alula') !== -1 || typedKeys.indexOf('fish') !== -1) {
			isTriggered = true;
			doThing();
		}
	}
});

function doThing() {
	var audio = new Audio('static/audioindex/bgs/teleport_boop.wav');
	audio.volume = 1.0;
	audio.play().catch(function(err) {});

	var fadeInterval = setInterval(function() {
		if (audio.volume > 0.05) {
			audio.volume -= 0.05;
		} else {
			audio.volume = 0;
			clearInterval(fadeInterval);
		}
	}, 175);

	setTimeout(function() {
		window.location.href = 'alula.html';
	}, 3500);
}