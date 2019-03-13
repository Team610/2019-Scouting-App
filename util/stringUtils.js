"use strict";

exports.escape = (str) => {
	for (let i = 0; i < str.length; i++) {
		if (str.charAt(i) === `'` || str.charAt(i) === '"' || str.charAt(i) === '\\' || str.charAt(i) === '`') {
			str = str.substr(0, i) + '\\' + str.substr(i, str.length - i);
			i++;
		}
	}
	return str;
}

let inject = exports.inject = (str, inject, pos = 0) => {
	if (pos < 0) {
		return str.substring(0, str.length + pos) + inject + str.substring(str.length + pos);
	} else {
		return str.substring(0, pos) + inject + str.substring(pos);
	}
}

exports.stringify = (aObj) => {
	let str = JSON.stringify(aObj);
	let depth = 0;
	let tabs = '\t\t\t\t\t\t\t\t';
	for (let i = 0; i < str.length; i++) {
		let injInd = -1;
		if (str.charAt(i) === '{' || str.charAt(i) === '[') {
			depth++;
			injInd = i + 1;
		} else if (str.charAt(i) === '}' || str.charAt(i) === ']') {
			injInd = i;
			i+=depth;
			depth--;
		} else if (str.charAt(i) === ',') {
			injInd = i + 1;
		}
		if (injInd >= 0)
			str = inject(str, '\n'+tabs.substring(0, depth), injInd);
	}
	return str;
}
