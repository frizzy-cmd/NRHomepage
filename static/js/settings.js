// settings.js

document.addEventListener('DOMContentLoaded', function () {
	var themeSelect = document.getElementById('themeSelect');
	var wpDefault = document.getElementById('wpDefault');
	var wpAuto = document.getElementById('wpAuto');
	var wpPreset = document.getElementById('wpPreset');
	var wpCustom = document.getElementById('wpCustom');
	var presetOptionsContainer = document.getElementById('presetOptionsContainer');
	var wpPresetSelect = document.getElementById('wpPresetSelect');
	var customUploadContainer = document.getElementById('customUploadContainer');
	var customWpFile = document.getElementById('customWpFile');
	var wpPreview = document.getElementById('wpPreview');
	var twmCursorCheckbox = document.getElementById('twmCursorCheckbox');

	var currentTheme = localStorage.getItem('oneshot-theme') || 'theme-barrens';
	var currentWpType = localStorage.getItem('oneshot-wp-type') || 'default';
	var currentWpVal = localStorage.getItem('oneshot-wp-val') || '';
	var currentTwmCursor = localStorage.getItem('oneshot-twm-cursor') === 'true';

	if (themeSelect) themeSelect.value = currentTheme;
	if (twmCursorCheckbox) twmCursorCheckbox.checked = currentTwmCursor;

	if (currentWpType === 'auto' && wpAuto) wpAuto.checked = true;
	else if (currentWpType === 'preset' && wpPreset) wpPreset.checked = true;
	else if (currentWpType === 'custom' && wpCustom) wpCustom.checked = true;
	else if (wpDefault) wpDefault.checked = true;

	if (currentWpType === 'preset' && currentWpVal && wpPresetSelect) {
		wpPresetSelect.value = currentWpVal;
	}

	updateUIState();
	updatePreview();

	var radios = document.querySelectorAll('input[name="wpType"]');
	for (var i = 0; i < radios.length; i++) {
		radios[i].addEventListener('change', function () {
			updateUIState();
			updatePreview();
		});
	}

	if (themeSelect) themeSelect.addEventListener('change', updatePreview);
	if (wpPresetSelect) wpPresetSelect.addEventListener('change', updatePreview);

	if (customWpFile) {
		customWpFile.addEventListener('change', function (e) {
			if (e.target.files && e.target.files.length) {
				var file = e.target.files[0];
				var reader = new FileReader();
				reader.onload = function (evt) {
					currentWpVal = evt.target.result;
					updatePreview();
				};
				reader.readAsDataURL(file);
			}
		});
	}

	function updateUIState() {
		var selectedType = getSelectedWpType();
		if (presetOptionsContainer) {
			presetOptionsContainer.style.display = (selectedType === 'preset') ? 'block' : 'none';
		}
		if (customUploadContainer) {
			customUploadContainer.style.display = (selectedType === 'custom') ? 'block' : 'none';
		}
	}

	function getSelectedWpType() {
		var checked = document.querySelector('input[name="wpType"]:checked');
		return checked ? checked.value : 'default';
	}

	function updatePreview() {
		if (!wpPreview) return;
		var type = getSelectedWpType();
		var theme = themeSelect ? themeSelect.value : 'theme-barrens';

		if (type === 'default') {
			wpPreview.style.backgroundImage = 'none';
			wpPreview.textContent = 'Solid Color (' + theme + ')';
		} else if (type === 'auto') {
			var autoWp = 'static/img/wallpaper/barrensWP.jpg';
			if (theme === 'theme-refuge') autoWp = 'static/img/wallpaper/refugeWP.jpg';
			if (theme === 'theme-glen') autoWp = 'static/img/wallpaper/glenWP.jpg';
			wpPreview.style.backgroundImage = 'url("' + autoWp + '")';
			wpPreview.textContent = 'Auto Area Wallpaper';
		} else if (type === 'preset') {
			var val = wpPresetSelect ? wpPresetSelect.value : '';
			wpPreview.style.backgroundImage = 'url("' + val + '")';
			var txt = (wpPresetSelect && wpPresetSelect.selectedIndex >= 0) ? wpPresetSelect.options[wpPresetSelect.selectedIndex].text : 'Preset Wallpaper';
			wpPreview.textContent = 'Preset: ' + txt;
		} else if (type === 'custom' && currentWpVal) {
			wpPreview.style.backgroundImage = 'url("' + currentWpVal + '")';
			wpPreview.textContent = 'Custom Uploaded Image';
		}
	}

	window.saveSettings = function () {
		var theme = themeSelect ? themeSelect.value : 'theme-barrens';
		var type = getSelectedWpType();
		var val = '';
		var isTwmCursor = twmCursorCheckbox ? twmCursorCheckbox.checked : false;

		if (type === 'preset' && wpPresetSelect) {
			val = wpPresetSelect.value;
			var selectedOpt = wpPresetSelect.options[wpPresetSelect.selectedIndex];
			var categoryName = (selectedOpt && selectedOpt.parentNode) ? selectedOpt.parentNode.label : '';

			var themeRegion = '';
			if (theme === 'theme-barrens') themeRegion = 'Barrens';
			else if (theme === 'theme-refuge') themeRegion = 'Refuge';
			else if (theme === 'theme-glen') themeRegion = 'Glen';

			if ((categoryName === 'Barrens' || categoryName === 'Glen' || categoryName === 'Refuge') && categoryName !== themeRegion) {
				var confirmMatch = confirm('The current wallpaper (' + categoryName + ') and theme (' + themeRegion + ') selected don\'t match well. Still continue?');
				if (!confirmMatch) return;
			}
		}

		if (type === 'custom') val = currentWpVal;

		localStorage.setItem('oneshot-theme', theme);
		localStorage.setItem('oneshot-wp-type', type);
		localStorage.setItem('oneshot-wp-val', val);
		localStorage.setItem('oneshot-twm-cursor', isTwmCursor ? 'true' : 'false');

		if (window.applySiteThemeAndWp) window.applySiteThemeAndWp();
		showAlert("Settings saved successfully!", "success");
	};

	window.resetSettings = function () {
		if (confirm('Reset settings to default?')) {
			localStorage.setItem('oneshot-theme', 'theme-barrens');
			localStorage.setItem('oneshot-wp-type', 'default');
			localStorage.setItem('oneshot-wp-val', '');
			localStorage.setItem('oneshot-twm-cursor', 'false');

			if (themeSelect) themeSelect.value = 'theme-barrens';
			if (wpDefault) wpDefault.checked = true;
			if (twmCursorCheckbox) twmCursorCheckbox.checked = false;
			currentWpVal = '';

			updateUIState();
			updatePreview();
			if (window.applySiteThemeAndWp) window.applySiteThemeAndWp();
		}
	};
});