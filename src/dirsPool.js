const fs = require('fs-extra');

let expo = module.exports = {};

const txt = 'dirsPool.txt';

expo.list = function(){
    let str = fs.readFileSync(txt, 'utf8');
    return str.split('\n').splice(1);
}

expo.remember = function(workingDir){ 
    if(!expo.list().includes(workingDir))
        fs.appendFileSync(txt, '\n' + workingDir, 'utf8');
}