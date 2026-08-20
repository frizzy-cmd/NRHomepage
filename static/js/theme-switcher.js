(function () {
	const savedTheme = localStorage.getItem('oneshot-theme') || 'theme-barrens';
	document.documentElement.className = savedTheme;

	document.addEventListener('DOMContentLoaded', () => {
		document.body.className = savedTheme;

		const themeSelect = document.getElementById('themeSelect');
		if (themeSelect) {
			themeSelect.value = savedTheme;
			themeSelect.addEventListener('change', (e) => {
				const newTheme = e.target.value;
				document.body.className = newTheme;
				document.documentElement.className = newTheme;
				localStorage.setItem('oneshot-theme', newTheme);
			});
		}
	});
})();