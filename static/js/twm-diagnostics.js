// twm-diagnostics.js

document.addEventListener('DOMContentLoaded', function() {
	var detectedSquares = [];
	var detectedOS = getOS();

	// we check display overview
	var w = window.innerWidth || document.documentElement.clientWidth;
	var h = window.innerHeight || document.documentElement.clientHeight;
	setText('diagRes', screen.width + ' × ' + screen.height + ' px');
	setText('diagViewport', w + ' × ' + h + ' px');
	setText('diagAspect', calcAspRT(screen.width, screen.height));
	setText('diagColorDepth', (screen.colorDepth || 24) + '-bit');
	setText('diagDpr', (window.devicePixelRatio || 1).toFixed(2) + 'x');
	setText('diagOrientation', (screen.orientation ? screen.orientation.type : 'landscape'));

	if (screen.width < 1280 || screen.height < 720) {
		detectedSquares.push('Screen resolution is below 720p (1280×720)');
	}

	// we check hw
	setText('diagOS', detectedOS);
	setText('diagCores', (navigator.hardwareConcurrency || 'N/A') + ' cores');
	
	var devMem = navigator.deviceMemory || 4;
	setText('diagRam', '~' + devMem + ' GB');
	if (devMem < 4) {
		detectedSquares.push('Device RAM is below 4 GB');
	}

	setText('diagTouch', (navigator.maxTouchPoints > 0 ? 'Touchscreen (' + navigator.maxTouchPoints + ')' : 'Mouse'));
	setText('diagPointer', (matchMedia('(pointer: coarse)').matches ? 'Coarse touch' : 'Fine mouse'));

	// b3r check
	if (navigator.getBattery) {
		navigator.getBattery().then(function(b) {
			var level = Math.round(b.level * 100) + '%';
			setText('diagBattery', level + (b.charging ? ' (Charging)' : ''));
			if (!b.charging && b.level < 0.2) {
				detectedSquares.push('Battery is critically low (' + level + ')');
				updRep();
			}
		});
	} else {
		setText('diagBattery', 'N/A');
	}

	// we check graphics
	var webglInfo = getWebGL();
	setText('diagWebglVer', webglInfo.ver);
	setText('diagGpuVendor', webglInfo.vendor);
	setText('diagGpuModel', webglInfo.renderer);
	setText('diagMaxTexture', webglInfo.maxTexture ? webglInfo.maxTexture + ' px' : 'N/A');

	if (webglInfo.ver === 'Disabled / Unsupported') {
		detectedSquares.push('WebGL hardware acceleration is unavailable');
	}

	// we check network
	setText('diagOnline', navigator.onLine ? 'OK' : 'OFFLINE');
	var conn = navigator.connection || {};
	setText('diagNetType', conn.effectiveType || '4G');
	setText('diagDownlink', conn.downlink ? conn.downlink + ' Mbps' : 'N/A');

	if (conn.downlink && conn.downlink < 1.0) {
		detectedSquares.push('Downlink speed is slow (' + conn.downlink + ' Mbps)');
	}

	var startTime = Date.now();
	fetch('/api/site/status')
		.then(function(res) {
			var ping = Date.now() - startTime;
			setText('diagPing', ping + ' ms');
			if (ping > 250) {
				detectedSquares.push('Latency to Cloudflare edge server is ' + ping + ' ms');
			}
			updRep();
		})
		.catch(function() {
			setText('diagPing', 'Timeout / Failed to fetch');
		});

	// we check audio
	var audioContext = window.AudioContext || window.webkitAudioContext;
	if (audioContext) {
		var audioCtx = new audioContext();
		setText('diagAudioApi', 'OK');
		setText('diagSampleRate', audioCtx.sampleRate + ' Hz');
		setText('diagAudioLatency', (audioCtx.baseLatency ? (audioCtx.baseLatency * 1000).toFixed(1) + ' ms' : 'N/A'));
	} else {
		setText('diagAudioApi', 'Disabled');
		detectedSquares.push('Web Audio API is disabled');
	}

	var testAudio = document.createElement('audio');
	setText('diagOgg', testAudio.canPlayType('audio/ogg') ? 'Supported' : 'No');
	setText('diagWav', testAudio.canPlayType('audio/wav') ? 'Supported' : 'No');
    //TODO: add more audio checks (mp3, flac, opus, etc..........)
    // this todo was made at 3/9/2026 12:45 am god i will not do this will i?

	// we check storage
	var hasLocal = false;
	try {
		localStorage.setItem('twm_test', '1');
		localStorage.removeItem('twm_test');
		hasLocal = true;
	} catch(e) {}

	setText('diagLocalstorage', hasLocal ? 'ON' : 'OFF');
	setText('diagSessionstorage', window.sessionStorage ? 'ON' : 'OFF');
	setText('diagIndexeddb', window.indexedDB ? 'ON' : 'OFF');
	setText('diagCookies', navigator.cookieEnabled ? 'ON' : 'OFF');

	if (!hasLocal || !navigator.cookieEnabled) {
		detectedSquares.push('LocalStorage/IndexedDB/Cookies/SessionStorage is disabled/unavailable');
	}

	// we check time
	setText('diagTimezone', (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'));
	setText('diagUtcOffset', (-new Date().getTimezoneOffset()) + ' mins');
	setText('diagLang', (navigator.language || 'en'));
	setText('diagDnt', (navigator.doNotTrack === '1' ? 'ON' : 'OFF'));

	// upotime
	var pageUptime = 0;
	setInterval(function() {
		pageUptime++;
		setText('diagUptime', pageUptime + 's');
	}, 1000);

	// give our report what we think
	updRep();

	function updRep() {
		var pfpEl = document.getElementById('enCat');
		var quoteEl = document.getElementById('nikoQuote');
		var countEl = document.getElementById('squareCount');
		var percentEl = document.getElementById('squarePercent');
		var listContainer = document.getElementById('squareListContainer');

		var sqCount = detectedSquares.length;
		if (countEl) countEl.textContent = sqCount;
		if (percentEl) percentEl.textContent = (sqCount * 5.0).toFixed(1) + '%';

        // thoughts of twm
		if (sqCount === 0) {
			if (pfpEl) pfpEl.src = 'static/pfp/en_83c.png';
			if (quoteEl) quoteEl.textContent = 'Yay! No squares!';

			listContainer.innerHTML = '<div class="no-squares-box" id="noSquareDots">No squares detected...</div>';
			startAnim();
		} 
		else if (sqCount >= 1 && sqCount <= 3) {
			if (pfpEl) pfpEl.src = 'static/pfp/en_eyeclosed.png';
			if (quoteEl) quoteEl.textContent = detectedOS + ' user, i think you should look into this.';
			giveThoughts();
		} 
		else if (sqCount >= 4 && sqCount <= 5) {
			if (pfpEl) pfpEl.src = 'static/pfp/en_upset2.png';
			if (quoteEl) quoteEl.textContent = 'Come on, you can do better than this!';
			giveThoughts();
		} 
		else if (sqCount >= 6 && sqCount <= 9) {
			if (pfpEl) pfpEl.src = 'static/pfp/en_distressed_talk.png';
			if (quoteEl) quoteEl.textContent = 'How can you let it be this bad?';
			giveThoughts();
		} 
		else { // 10+
			if (pfpEl) pfpEl.src = 'static/pfp/en_what2.png';
			if (quoteEl) quoteEl.textContent = "I'm not even gonna question how you got it THIS bad. but you need to fix this.";
			giveThoughts();
		}
	}

	function giveThoughts() {
		var listContainer = document.getElementById('squareListContainer');
		if (!listContainer) return;

		var html = '<ul class="square-list">';
		for (var i = 0; i < detectedSquares.length; i++) {
			html += '<li class="square-item">Square: ' + escapeHtml(detectedSquares[i]) + '</li>';
		}
		html += '</ul>';
		listContainer.innerHTML = html;
	}

	var dotTimer = null;
	function startAnim() {
		if (dotTimer) return;
		var dots = ['.', '..', '...'];
		var idx = 0;
		dotTimer = setInterval(function() {
			var dotsEl = document.getElementById('noSquareDots');
			if (dotsEl) {
				dotsEl.textContent = 'No squares detected' + dots[idx];
				idx = (idx + 1) % dots.length;
			}
		}, 500);
	}

	function setText(id, txt) {
		var el = document.getElementById(id);
		if (el) el.textContent = txt;
	}

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getOS() {
        var ua = navigator.userAgent;
        // check phones first
        if (ua.indexOf('Android') !== -1) return 'Android';
        if (ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1 || ua.indexOf('iPod') !== -1) return 'iOS';

        //then we'll check pc
        if (ua.indexOf('Linux') !== -1) return 'Linux';
        if (ua.indexOf('Windows') !== -1) return 'Windows';
        if (ua.indexOf('Mac') !== -1) return 'macOS';

        return 'Unknown';
    }


	function calcAspRT(width, height) {
		function gcd(a, b) { return b ? gcd(b, a % b) : a; }
		var divisor = gcd(width, height);
		return (width / divisor) + ':' + (height / divisor);
	}

	function getWebGL() {
		try {
			var canvas = document.createElement('canvas');
			var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
			if (!gl) return { ver: 'Disabled / Unsupported', vendor: 'N/A', renderer: 'N/A' };

			var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
			var vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Generic';
			var renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Generic';
			var maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);

			return { ver: 'WebGL 1.0', vendor: vendor, renderer: renderer, maxTexture: maxTex };
		} catch(e) {
			return { ver: 'Disabled', vendor: 'N/A', renderer: 'N/A' };
		}


		detectedSquares = [];
		for (var i = 0; i < count && i < fakeReasons.length; i++) {
			detectedSquares.push(fakeReasons[i]);
		}
		updRep();
		console.log('force ' + count + ' sqr');
	};

	// check URL prm ?squares=N
	// var urlMatch = window.location.search.match(/[?&]squares=(\d+)/);
	// if (urlMatch && urlMatch[1]) {
	// 	setTimeout(function() {
	// 		window.twmTestSquares(parseInt(urlMatch[1]));
	// 	}, 300);
	// }
    //deprecaetd bc of dbg panel and no1s gonna use this

    window.twmDebug = function () {
        tglDbgMdl();
    };

    window.tglDbgMdl = function () {
        var modal = document.getElementById('twmDebugModal');
        if (modal) {
            modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
        }
    };

    window.rstDbg = function () {
        debugMode = false;
        var checkboxes = document.querySelectorAll('#twmDebugModal input[type="checkbox"]');
        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = false;
        }
        location.reload();
    };

    window.doDbgTgl = function () {
        debugMode = true;
        detectedSquares = [];

        if (document.getElementById('dbgWebgl')?.checked) {
            setText('diagWebglVer', 'Disabled');
            detectedSquares.push('WebGL hardware acceleration is unavailable');
        }
        if (document.getElementById('dbgPing')?.checked) {
            setText('diagPing', '385 ms');
            detectedSquares.push('Latency to Cloudflare edge server is 385 ms');
        }
        if (document.getElementById('dbgSpeed')?.checked) {
            setText('diagDownlink', '0.3 Mbps');
            detectedSquares.push('Downlink speed is slow (0.3 Mbps)');
        }
        if (document.getElementById('dbgRam')?.checked) {
            setText('diagRam', '2 GB');
            detectedSquares.push('Device RAM is below 4 GB');
        }
        if (document.getElementById('dbgBattery')?.checked) {
            setText('diagBattery', '12%');
            detectedSquares.push('Battery is critically low (12%)');
        }
        if (document.getElementById('dbgRes')?.checked) {
            setText('diagRes', '640 × 480 px');
            detectedSquares.push('Screen resolution is below 720p (1280×720)');
        }
        if (document.getElementById('dbgStorage')?.checked) {
            setText('diagLocalstorage', 'OFF');
            detectedSquares.push('LocalStorage/IndexedDB/Cookies/SessionStorage is disabled/unavailable');
        }
        if (document.getElementById('dbgAudio')?.checked) {
            setText('diagAudioApi', 'Disabled');
            detectedSquares.push('Web Audio API is disabled');
        }

        updRep();
    };

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.shiftKey && (e.code === 'KeyD' || e.key === 'D')) {
            e.preventDefault();
            window.tglDbgMdl();
        }
    });
});