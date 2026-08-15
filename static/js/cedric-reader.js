document.addEventListener('DOMContentLoaded', () => {
	const dropZone = document.getElementById('dropZone');
	const fileInput = document.getElementById('fileInput');
	const parsedCard = document.getElementById('parsedCard');
	const parsedTable = document.getElementById('parsedTable');
	const flagsContainer = document.getElementById('flagsContainer');
	const flagsSection = document.getElementById('flagsSection');

	if (!dropZone || !fileInput) return;

	dropZone.addEventListener('click', () => fileInput.click());

	dropZone.addEventListener('dragover', (e) => {
		e.preventDefault();
		dropZone.classList.add('dragover');
	});

	dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

	dropZone.addEventListener('drop', (e) => {
		e.preventDefault();
		dropZone.classList.remove('dragover');
		if (e.dataTransfer.files.length) {
			parseFile(e.dataTransfer.files[0]);
		}
	});

	fileInput.addEventListener('change', (e) => {
		if (e.target.files.length) {
			parseFile(e.target.files[0]);
		}
	});

	function parseFile(file) {
		const reader = new FileReader();
		reader.onload = function (evt) {
			const bytes = new Uint8Array(evt.target.result);
			if (file.name.toLowerCase().includes('p-settings')) {
				parsePSettings(bytes, file.name);
			} else {
				parseSaveDat(bytes, file.name);
			}
		};
		reader.readAsArrayBuffer(file);
	}

	function decodeMarshalFixnum(bytes, offset) {
		let b = bytes[offset];
		if (b === 0) return { val: 0, next: offset + 1 };
		if (b > 5 && b < 128) return { val: b - 5, next: offset + 1 };
		if (b === 1) return { val: bytes[offset + 1], next: offset + 2 };
		return { val: 0, next: offset + 1 };
	}

	function parsePSettings(bytes, fileName) {
		if (bytes[0] !== 4 || bytes[1] !== 8) {
			alert('Invalid Marshal header!!');
			return;
		}

		parsedCard.style.display = 'block';
		flagsSection.style.display = 'block';
		parsedTable.innerHTML = '';
		flagsContainer.innerHTML = '';

		// parse plr name
		let ign = 'Player';
		for (let i = 0; i < bytes.length - 3; i++) {
			if (bytes[i] === 0x49 && bytes[i + 1] === 0x22) {
				let lenInfo = decodeMarshalFixnum(bytes, i + 2);
				let strLen = lenInfo.val;
				let strStart = lenInfo.next;
				if (strStart + strLen <= bytes.length) {
					let nameBytes = bytes.slice(strStart, strStart + strLen);
					ign = new TextDecoder('utf-8').decode(nameBytes);
				}
				break;
			}
		}

		// read from array obj.1
		let switches = [];
		for (let i = 2; i < bytes.length; i++) {
			if (bytes[i] === 0x54) switches.push(true);  // 'T'
			else if (bytes[i] === 0x46) switches.push(false); // 'F'
		}

		// ext. var
		let timesCleared = 1;
		let timesRue = 0;
		for (let i = 0; i < bytes.length - 2; i++) {
			if (bytes[i] === 0x69) { // Fixnum marker 'i'
				let res1 = decodeMarshalFixnum(bytes, i + 1);
				if (res1.val >= 0 && res1.val < 1000) {
					timesCleared = res1.val;
					break;
				}
			}
		}

		parsedTable.innerHTML = `
			<tr><td><strong>Name:</strong></td><td>${fileName}</td></tr>
			<tr><td><strong>In-game name:</strong></td><td><code style="color:var(--header-subtitle);">${ign}</code></td></tr>
			<tr><td><strong>Times game beat:</strong></td><td>${timesCleared}</td></tr>
			<tr><td><strong>Times talked to Rue:</strong></td><td>${timesRue}</td></tr>
			<tr><td><strong>Size:</strong></td><td>${bytes.length} bytes</td></tr>
		`;

		const flagList = [
			{ name: 'Beat solstice', active: switches[9] || false },
			{ name: 'Beat game once', active: switches[1] || false },
			{ name: 'Smashed lightbulb', active: switches[2] || false },
			{ name: 'Saved world', active: switches[3] || false },
			{ name: 'Talked to Rue', active: switches[4] || false },
			{ name: 'Knows Rues name', active: switches[5] || false },
			{ name: 'Picked memory', active: switches[6] || false },
			{ name: 'Disable stuff', active: switches[23] || false }
		];

		flagList.forEach(item => {
			let badge = document.createElement('span');
			badge.className = item.active ? 'badge-flag badge-on' : 'badge-flag badge-off';
			badge.textContent = `${item.name}: ${item.active ? 'True' : 'False'}`;
			flagsContainer.appendChild(badge);
		});
	}

	function parseSaveDat(bytes, fileName) {
		parsedCard.style.display = 'block';
		flagsSection.style.display = 'none';
		parsedTable.innerHTML = '';

		parsedTable.innerHTML = `
			<tr><td><strong>Name:</strong></td><td>${fileName}</td></tr>
			<tr><td><strong>Type:</strong></td><td>.dat</td></tr>
			<tr><td><strong>Size:</strong></td><td>${bytes.length} bytes</td></tr>
		`;
	}
});