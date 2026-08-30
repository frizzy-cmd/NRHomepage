// (function () {
// 	const savedTheme = localStorage.getItem('oneshot-theme') || 'theme-barrens';
// 	document.documentElement.className = savedTheme;

// 	document.addEventListener('DOMContentLoaded', () => {
// 		document.body.className = savedTheme;

// 		const themeSelect = document.getElementById('themeSelect');
// 		if (themeSelect) {
// 			themeSelect.value = savedTheme;
// 			themeSelect.addEventListener('change', (e) => {
// 				const newTheme = e.target.value;
// 				document.body.className = newTheme;
// 				document.documentElement.className = newTheme;
// 				localStorage.setItem('oneshot-theme', newTheme);
// 			});
// 		}
// 	});
// })();

// OLD DEPRECATED^^^^^^^^^^^^^

function doTheThing() {
	var savedTheme = localStorage.getItem('oneshot-theme') || 'theme-barrens';
	var savedWpType = localStorage.getItem('oneshot-wp-type') || 'default';
	var savedWpVal = localStorage.getItem('oneshot-wp-val') || '';

	var target = document.body || document.documentElement;
	if (!target) return;
	document.documentElement.className = savedTheme;
	if (document.body) document.body.className = savedTheme;

	target.style.backgroundImage = 'none';

	if (savedWpType === 'auto') {
		var autoWp = 'static/img/wallpaper/barrensWP.jpg';
		if (savedTheme === 'theme-refuge') autoWp = 'static/img/wallpaper/refugeWP.jpg';
		if (savedTheme === 'theme-glen') autoWp = 'static/img/wallpaper/glenWP.jpg';

		target.style.backgroundImage = 'url("' + autoWp + '")';
		target.style.backgroundSize = 'cover';
		target.style.backgroundPosition = 'center center';
		target.style.backgroundAttachment = 'fixed';
		target.style.backgroundRepeat = 'no-repeat';
	} 
	else if ((savedWpType === 'preset' || savedWpType === 'custom') && savedWpVal) {
		target.style.backgroundImage = 'url("' + savedWpVal + '")';
		target.style.backgroundSize = 'cover';
		target.style.backgroundPosition = 'center center';
		target.style.backgroundAttachment = 'fixed';
		target.style.backgroundRepeat = 'no-repeat';
	}

	var selects = document.querySelectorAll('#themeSelect');
	for (var i = 0; i < selects.length; i++) {
		selects[i].value = savedTheme;
		selects[i].onchange = function (e) {
			var newTheme = e.target.value;
			localStorage.setItem('oneshot-theme', newTheme);
			doTheThing();
		};
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', doTheThing);
} else {
	doTheThing();
}

window.doTheThing = doTheThing;