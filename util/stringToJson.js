var fs = require('fs');
module.exports = function(filepath, encoding) {
    filepath = __dirname + '/' + filepath;
    if (typeof (encoding) == 'undefined') {
        encoding = 'utf8';
    }
    var file = fs.readFileSync(filepath, encoding);
    return JSON.parse(file);
}