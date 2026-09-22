// obj_room_man - DELTARUNE ref!!!!!!

// entry check - only allowed in via the nav ft in theme-switcher.js
// typing /man or /man.html directly or reloading after your one legit entry redir back to index.html
var manLegit = false;
try {
	manLegit = sessionStorage.getItem('nr-man-legit-entry') === '1';
} catch (e) {}

if (!manLegit) {
	window.location.replace('index.html');
} else {
	try {
		sessionStorage.removeItem('nr-man-legit-entry'); // onetime use (heh.. guess you could say oneshot)
	} catch (e) {}

	var img = document.getElementById('manImg');
	var audio = document.getElementById('manAudio');
	var revealed = false;
	var step = 0; // 0=not started (go to function interactWithMan for more info)

	function hasEgg() {
		var lsFlag = false;
		try {
			lsFlag = localStorage.getItem('nr-man-got-egg') === 'true';
		} catch (e) {}

		var cookieFlag = document.cookie.indexOf('nr_man_got_egg_ck=1') !== -1;

		return lsFlag || cookieFlag; // either one being there counts
	}

	function eggIsTaken() {
		try {
			localStorage.setItem('nr-man-got-egg', 'true');
		} catch (e) {}
		document.cookie = 'nr_man_got_egg_ck=1; path=/; max-age=31536000'; // 1yr y not
	}

	// waits for literally any click or keydown anywhere on the page bc browsers dont allow autoplay.. stupid browsers
	function showTree() {
		if (revealed) return;
		revealed = true;

		img.style.opacity = '1';
		img.style.pointerEvents = 'auto';

		audio.currentTime = 0;
		audio.play().catch(function () {});
	}

	function giveEgg() {
		alert('* ( You received an Egg. )');
		eggIsTaken();
	}

	// click or enter to interact
	function interactWithMan() {
		if (hasEgg()) {
			alert('* ( Well, there is not a man here. )');
			return;
		}

		if (step === 0) {
			alert('* ( He is behind the tree. )');
			step = 1;
		} else if (step === 1) {
			alert('* ( Well, there is a man here. )');
			step = 2;
		} else if (step === 2) {
			var answer = confirm('* ( He offered you something. )');

			if (answer) { // IDK WHAT SELECTING NPO DOES IF ORGOT LOL
				giveEgg();
			} else {
				giveEgg();
			}
			step = 0;
		}
	}

	img.addEventListener('click', interactWithMan);

	document.addEventListener('click', showTree);
	document.addEventListener('keydown', function (e) {
		if (!revealed) {
			showTree();
			return;
		}
		if (e.key === 'Enter') {
			interactWithMan();
		}
	});
}