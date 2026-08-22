// solstice-puzzle.js

var TARGET_SEQUENCE = ['S', 'O', 'L', 'S', 'T', 'I', 'C', 'E'];
var currentStep = 0;

document.addEventListener('DOMContentLoaded', function() {
	var card = document.querySelector('.unavail-card') || document.getElementById('message');
	if (!card) return;

	// create container
	var gameContainer = document.createElement('div');
	gameContainer.id = 'solGame';
	gameContainer.style.cssText = 'margin-top: 20px; border-top: 1px dashed var(--msg-border, #fa9040); padding-top: 16px; text-align: center;';

	var title = document.createElement('div');
	// title.style.cssText = 'font-size: 11pt; color: var(--header-subtitle, #fa9040); margin-bottom: 10px; font-weight: bold;';
	// title.textContent = 'Spell S-O-L-S-T-I-C-E:';
	gameContainer.appendChild(title);

	var btnGrid = document.createElement('div');
	btnGrid.style.cssText = 'display: flex; justify-content: center; gap: 6px; flex-wrap: wrap;';

	for (var i = 0; i < TARGET_SEQUENCE.length; i++) {
		var letter = TARGET_SEQUENCE[i];
		var btn = document.createElement('button');
		btn.className = 'solstice-btn';
		btn.setAttribute('data-index', i);
		btn.setAttribute('data-letter', letter);
		btn.textContent = letter;
		btn.style.cssText = `
			background: var(--input-bg, #4000a0);
			color: #ffffff;
			border: 2px solid var(--msg-border, #fa9040);
			padding: 6px 12px;
			font-family: Terminus, monospace;
			font-size: 12pt;
			cursor: pointer;
			border-radius: 4px;
		`;

		btn.addEventListener('click', function() {
			var clickedLetter = this.getAttribute('data-letter');

			if (clickedLetter === TARGET_SEQUENCE[currentStep]) {
                //play menu_dec every correct
				var clickSound = new Audio('static/audioindex/se/menu_decision.wav');
				clickSound.play().catch(function(e) {});

				this.style.background = '#ffb300';
				this.style.borderColor = '#ffd54f';
				this.style.color = '#000000';
				currentStep++;
                
                //checking
				if (currentStep === TARGET_SEQUENCE.length) {
					playThnRst();
				}
			} else {
				// wrong
				var errorSound = new Audio('static/audioindex/se/menu_buzzer.wav');
				errorSound.play().catch(function(e) {});
				
				resetPzl();
			}
		});

		btnGrid.appendChild(btn);
	}

	gameContainer.appendChild(btnGrid);
	card.appendChild(gameContainer);
});

function resetPzl() {
	currentStep = 0;
	var buttons = document.querySelectorAll('.solstice-btn');
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].style.background = 'var(--input-bg, #4000a0)';
		buttons[i].style.borderColor = 'var(--msg-border, #fa9040)';
		buttons[i].style.color = '#ffffff';
	}
}

function playThnRst() {
	var audio = new Audio('static/audioindex/se/bell.wav');
	audio.play().catch(function(e) {});

	setTimeout(function() {
		resetPzl();
	}, 1500);
}