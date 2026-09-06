// INIT 6/9/2026 FOR ACCESSIBILITY UPD
function nrWantsReducedMotion() {
	var manual = localStorage.getItem('oneshot-reduced-motion') === 'true';
	var osLevel = false;
	try {
		osLevel = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	} catch (e) {}
	return manual || osLevel;
}

var reduceMotion = nrWantsReducedMotion();


var c = document.getElementById('starfield');
var x = c.getContext('2d');
var w = c.width = window.innerWidth;
var h = c.height = window.innerHeight;

var pts = [];
var maxPts = Math.min(120, Math.floor((w * h) / 8000));
var maxDist = 110;
var m = { x: null, y: null };

if (!reduceMotion) {
	for(var i=0; i<maxPts; i++) {
	    pts.push({
	        x: Math.random() * w,
	        y: Math.random() * h,
	        vx: (Math.random() - 0.5) * 1.2,
	        vy: (Math.random() - 0.5) * 1.2,
	        r: Math.random() * 2 + 1
	    });
	}

	window.addEventListener('mousemove', e => {
	    m.x = e.clientX;
	    m.y = e.clientY;
	});
	window.addEventListener('mouseout', () => { m.x = null; m.y = null; });
}

function renderSpace() {
    if (reduceMotion) return;
    x.clearRect(0,0,w,h);
    
    // draw if star is close
    for(var i=0; i<pts.length; i++) {
        for(var j=i+1; j<pts.length; j++) {
            var dx = pts[i].x - pts[j].x;
            var dy = pts[i].y - pts[j].y;
            var d = Math.sqrt(dx*dx + dy*dy);
            if(d < maxDist) {
                var alpha = (1 - (d/maxDist)) * 0.35;
                x.strokeStyle = 'rgba(250, 144, 64, ' + alpha + ')';
                x.lineWidth = 1;
                x.beginPath();
                x.moveTo(pts[i].x, pts[i].y);
                x.lineTo(pts[j].x, pts[j].y);
                x.stroke();
            }
        }
    }

    // update and draw
    for(var i=0; i<pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if(p.x < 0 || p.x > w) p.vx *= -1;
        if(p.y < 0 || p.y > h) p.vy *= -1;

        x.beginPath();
        x.arc(p.x, p.y, p.r, 0, Math.PI*2);
        x.fillStyle = 'rgba(255, 255, 255, 0.8)';
        x.fill();
    }
    requestAnimationFrame(renderSpace);
}
renderSpace();

window.onresize = function() {
    w = c.width = window.innerWidth;
    h = c.height = window.innerHeight;
};

// works! i think and idk and i dont wanna know
var upTimer = 0;
setInterval(() => {
    upTimer++;
    var el = document.getElementById('uptime-counter');
    if(el) el.innerText = upTimer + 's';
}, 1000);

var disk = document.getElementById('floppyClicker');
var wBox = document.getElementById('click-count');
var rBox = document.getElementById('read-count');
var chunks = [];

if(disk) {
    disk.onclick = function() {
        var t = Date.now();
        var sz = Math.floor(Math.random() * 20) + 12;
        chunks.push({t: t, sz: sz});
        calcSpeeds();
    }
}

function calcSpeeds() {
    var now = Date.now();
    chunks = chunks.filter(c => now - c.t < 1000);
    var sumW = chunks.reduce((acc, cur) => acc + cur.sz, 0);
    if(wBox) wBox.innerHTML = sumW + ' KB/s';
    if(rBox) rBox.innerHTML = (sumW * 2) + ' KB/s'; // reading is always faster obv...........
}

// DEPRECATE TEMP
/*
var emotes = [":3", ":O", ":P", ":D", ":)"];
var idx = 0;
window.addEventListener('mousemove', function(e) {
    if(Math.random() < 0.05) {
        var span = document.createElement('span');
        span.className = 'cursor-trail';
        span.innerText = emotes[idx++ % emotes.length];
        span.style.cssText = 'position:fixed; left:'+(e.clientX+10)+'px; top:'+(e.clientY+5)+'px; pointer-events:none; transition:0.6s;';
        document.body.appendChild(span);
        setTimeout(() => { span.style.opacity = 0; setTimeout(()=>span.remove(), 500); }, 200);
    }
});
*/

// drag card
var allCards = document.querySelectorAll('.card');
for(var i=0; i<allCards.length; i++) {
    (function(card){
        var drag = false;
        var sx, sy, ox, oy;

        card.addEventListener('mousedown', e => {
            if(!e.shiftKey) return;
            drag = true;
            card.classList.add('dragging');
            var rect = card.getBoundingClientRect();
            ox = rect.left + window.scrollX;
            oy = rect.top + window.scrollY;
            sx = e.clientX; sy = e.clientY;
            card.style.position = 'absolute';
            card.style.left = ox + 'px';
            card.style.top = oy + 'px';
            e.preventDefault();
        });

        window.addEventListener('mousemove', e => {
            if(!drag) return;
            card.style.left = (ox + (e.clientX - sx)) + 'px';
            card.style.top = (oy + (e.clientY - sy)) + 'px';
        });

        window.addEventListener('mouseup', () => {
            if(drag) {
                drag = false;
                card.classList.remove('dragging');
            }
        });
    })(allCards[i]);
}

// THIS IS VISIT COUNTER
var hits = localStorage.getItem('kip_site_views');
if(!hits) hits = 1042; // shh
else hits = parseInt(hits) + 1;
localStorage.setItem('kip_site_views', hits);
var hEl = document.getElementById('hitCounter');
if(hEl) hEl.textContent = String(hits).padStart(6, '0');