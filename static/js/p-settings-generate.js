// What did I exactly do in THIS updated .js instead of the original? I will explain it in the README.md, but ill say it here.

// The original .js by thehatkid forced the "times game cleared" var to always be 1 (also encoded as hex 06) and "times talked to rue" to be always 0 or hex 00. The updated script i made grabs wtv number you type into the form fields.

// encodeMarshalFixnum. Marshal uses a specific offset equation (value + 5) for small positive numbers up to 122. So if a number goes ABOVE 122,
//  it switches the structure of the byte layout entirely. The old script tacked on 5 to the length value blindly, upgraded 
// script handles large sizes properly so it wont crashe the engine if a user has long char names.

// I also swapped out the a bit repetitive if/else checks for clean operators to make the script faster and read easier.

// There are only 2 new fields in the save maker itself, which is not alot. But internally, it fixes a bit of bugs.

const MARSHAL_VERSION = ['04', '08']; // Marshal 4.8
const MARSHAL_ARRAY = '5b';		
const MARSHAL_FIXNUM = '69';	
const MARSHAL_IVAR = '49';		
const MARSHAL_STRING = '22';	
const MARSHAL_TRUE = '54';		
const MARSHAL_FALSE = '46';		

function hexToBytes(str) {
	if (!str) return new Uint8Array();
	var a = [];
	for (var i = 0, len = str.length; i < len; i+=2) {
		a.push(parseInt(str.substr(i,2),16));
	}
	return new Uint8Array(a);
}

function bytesToHex(byteArray) {
	return Array.from(byteArray, function(byte) {
		return ('0' + (byte & 0xFF).toString(16)).slice(-2);
	}).join('')
}

String.prototype.hexEncode = function() {
    var hex;
    var result = '';
    for (var i = 0; i < this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += ('0' + hex).slice(-2);
    }
    return result;
}

String.prototype.toUTF8Bytes = function() {
	return new TextEncoder().encode(this.toString());
}

function encodeMarshalFixnum(value) {
	if (value === 0) return '00';
	if (value > 0 && value < 123) {
		return ('0' + (value + 5).toString(16)).slice(-2);
	}
	let hex = value.toString(16);
	if (hex.length % 2 !== 0) hex = '0' + hex;
	let lenByte = ('0' + (hex.length / 2).toString(16)).slice(-2);
	let reversedHex = hex.match(/../g).reverse().join('');
	return lenByte + reversedHex;
}

function generate() {
	var hexstring = '';
	let i_ign = document.getElementById('i_ign').value;
	let ign_bytes = i_ign.toUTF8Bytes();

	let val_cleared = parseInt(document.getElementById('i_timescleared').value) || 0;
	let val_rue = parseInt(document.getElementById('i_timesrue').value) || 0;

	if (i_ign.length == 0) {
		showAlert("Please enter player name.", "instruction");
		return false;
	}

	// Normal flags.
	var s_beatsolstice = document.getElementById('s_beatsolstice').checked ? MARSHAL_TRUE : MARSHAL_FALSE;
	var s_beated = document.getElementById('s_beated').checked ? MARSHAL_TRUE : MARSHAL_FALSE;
	var s_smashed = document.getElementById('s_smashed').checked ? MARSHAL_TRUE : MARSHAL_FALSE;
	var s_saved = document.getElementById('s_saved').checked ? MARSHAL_TRUE : MARSHAL_FALSE;
	var s_talkedtorue = document.getElementById('s_talkedtorue').checked ? MARSHAL_TRUE : MARSHAL_FALSE;
	var s_knowruename = document.getElementById('s_knowruename').checked ? MARSHAL_TRUE : MARSHAL_FALSE;
	var s_pickedmemory = document.getElementById('s_pickedmemory').checked ? MARSHAL_TRUE : MARSHAL_FALSE;

	// Write game swtiches array! (151 to 175)
	hexstring += MARSHAL_VERSION[0] + MARSHAL_VERSION[1];
	hexstring += MARSHAL_ARRAY; 
	hexstring += '1e'; // 25 elements 

	hexstring += MARSHAL_FALSE;	// 151: START flag
	hexstring += s_beated;		// 152
	hexstring += s_smashed;		// 153
	hexstring += s_saved;		// 154
	hexstring += s_talkedtorue;	// 155
	hexstring += s_knowruename;	// 156
	hexstring += s_pickedmemory;// 157
	hexstring += MARSHAL_FALSE;	// 158
	hexstring += MARSHAL_FALSE;	// 159
	hexstring += s_beatsolstice	// 160
	for (var i = 161; i <= 173; i++) {
		hexstring += MARSHAL_FALSE;
	}

	hexstring += MARSHAL_FALSE;	// 175: END flag

	// Write game variables array. (76 to 100)
	// NOTE:: The engine checks switches 91, 98, 99, 100 inside the variable file buffer mapping.
	hexstring += MARSHAL_VERSION[0] + MARSHAL_VERSION[1];
	hexstring += MARSHAL_ARRAY; 
	hexstring += '1e'; 

	hexstring += MARSHAL_FIXNUM + encodeMarshalFixnum(0);           // 76: START
	hexstring += MARSHAL_FIXNUM + encodeMarshalFixnum(val_cleared);  // 77: loop count
	hexstring += MARSHAL_FIXNUM + encodeMarshalFixnum(val_rue);      // 78: rue talk count
	
	// blank for exp blocks.
	for (var i = 79; i <= 97; i++) {
		hexstring += MARSHAL_FIXNUM + '00';
	}

	// Write player name string object.
	hexstring += MARSHAL_VERSION[0] + MARSHAL_VERSION[1];
	hexstring += MARSHAL_IVAR + MARSHAL_STRING;
	hexstring += encodeMarshalFixnum(ign_bytes.length); 
	hexstring += bytesToHex(ign_bytes);
	hexstring += '063a064554'; 

	// PAYLOAD!
	var bytes = hexToBytes(hexstring);
	var ab = new ArrayBuffer(bytes.length);
	var ia = new Uint8Array(ab);
	for (var i = 0; i < bytes.length; i++) {
		ia[i] = bytes[i];
	}

	let blob = new Blob([ia], {type: 'application/octet-stream'});
	let dl = document.createElement('a');
	dl.href = URL.createObjectURL(blob);
	dl.setAttribute('download', 'p-settings.dat');
	dl.click();
}

// Fin.