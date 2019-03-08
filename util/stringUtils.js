"use strict";

exports.escape = (str) => {
	for (let i=0; i<str.length; i++) {
		if(str.charAt(i)===`'` || str.charAt(i)==='"' || str.charAt(i)==='\\' || str.charAt(i)==='`') {
			str = str.substr(0, i)+'\\'+str.substr(i, str.length-i);
			i++;
		}
	}
	return str;
}