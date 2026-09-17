// AlulaVerify CLIENT !! - v0.1

// CLIENT !!
// CLIENT !!
// CLIENT !!
// CLIENT !!
// CLIENT !!

// we make a proof of work puzzle then asks the server to let us thru

var startTime = null;
var hashCount = 0;
var dotsState = 0;

function getDest() {
    var params = new URLSearchParams(window.location.search);
    return params.get('dest') || 'index.html';
}

function animateDots() {
    var dotsEl = document.getElementById('dots');
    var patterns = ['.', '..', '...'];
    dotsState = (dotsState + 1) % patterns.length;
    if (dotsEl) dotsEl.textContent = patterns[dotsState];
}

// worker code as a blob.. keeps ui thread from freezing while we ummmmmmmmmmmmm
var workerCode = `
				self.onmessage = async function(e) {
					var salt = e.data.salt;
					var difficulty = e.data.difficulty;
					var nonce = 0;
					var target = '0'.repeat(difficulty);
					var lastReport = Date.now();

					while (true) {
						var input = salt + nonce;
						var enc = new TextEncoder().encode(input);
						var hashBuf = await crypto.subtle.digest('SHA-256', enc);
						var hashArr = Array.from(new Uint8Array(hashBuf));
						var hashHex = hashArr.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');

						if (hashHex.substring(0, difficulty) === target) {
							self.postMessage({ done: true, nonce: nonce, hash: hashHex });
							return;
						}

						nonce++;

						if (Date.now() - lastReport > 200) {
							self.postMessage({ done: false, hashCount: nonce });
							lastReport = Date.now();
						}
					}
				};
			`;

async function startVerify() {
    document.getElementById('verifyBox').style.display = 'block';

    var challengeRes;
    try {
        challengeRes = await fetch('/api/alulaverify/challenge', { method: 'POST' });
        if (!challengeRes.ok) throw new Error('bad challenge response');
    } catch (e) {
        showFail();
        return;
    }

    var challenge = await challengeRes.json();
    var salt = challenge.salt;
    var difficulty = challenge.difficulty;
    var signature = challenge.signature;

    document.getElementById('diffText').textContent = difficulty;
    document.getElementById('dtDiff').textContent = difficulty;
    document.getElementById('dtSalt').textContent = salt.substring(0, 12) + '...';

    startTime = Date.now();

    var blob = new Blob([workerCode], { type: 'application/javascript' });
    var worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = async function (e) {
        if (!e.data.done) {
            hashCount = e.data.hashCount;
            var elapsedSec = (Date.now() - startTime) / 1000;
            var kHs = elapsedSec > 0 ? (hashCount / elapsedSec / 1000).toFixed(2) : '0';
            document.getElementById('speedText').textContent = kHs;
            document.getElementById('dtHashes').textContent = hashCount;
            return;
        }

        // WE FOUND IT
        worker.terminate();
        var totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        document.getElementById('dtNonce').textContent = e.data.nonce;
        document.getElementById('dtTime').textContent = totalTime + 's';
                            // lol dt = deltarune lmaoooooo
        document.getElementById('statusText').textContent = 'Verified successfully!';

        try {
            var verifyRes = await fetch('/api/alulaverify/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ salt: salt, nonce: e.data.nonce, signature: signature })
            });

            if (!verifyRes.ok) throw new Error('verify failed');

            setTimeout(function () {
                window.location.href = getDest();
            }, 400);
        } catch (err) {
            showFail();
        }
    };

    worker.postMessage({ salt: salt, difficulty: difficulty });
}

function showFail() {
    document.getElementById('failBox').style.display = 'block';
    document.getElementById('statusText').textContent = 'Failed to verify, Refresh this page, or consider emailing support: support.kipsite@gmail.com';
}

setInterval(animateDots, 500);
startVerify();