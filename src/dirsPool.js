const fs = require('fs-extra');

let expo = module.exports = {};

const txt = __dirname+'/dirsPool.txt';

expo.list = function(){
    if(!fs.existsSync(txt))
        return [];

    let str = fs.readFileSync(txt, 'utf8');
    let ret = str.split('\n');
    ret.splice(0, 1);
    return ret;
}

expo.remember = function(workingDir){ 
    if(!expo.list().includes(workingDir)){
        fs.appendFileSync(txt, '\n' + workingDir, 'utf8');
        return true;
    }

    return false;
}

expo.recreate = function(array){
    let str = "";
    for(let item of array){
        str += "\n"+item;
    }

    fs.writeFileSync(txt, str, { encoding:'utf8', flag: fs.constants.O_TRUNC | fs.constants.O_WRONLY });
}

expo.remove = function(dir){
    let list = expo.list();

    let iDir = list.indexOf(dir);
    if(iDir >= 0){
        list.splice(iDir, 1);
        expo.recreate(list);

        return true;
    }

    return true;
}