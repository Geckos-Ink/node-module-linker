const fs = require('fs')
const watch = require('node-watch');

let cwd = process.cwd();

let mods = {};

function trimDir(dir){
    function ignoreChars(ch){
        return ch==' ' || ch=='\r';
    }

    // starts with
    while(dir.length > 0){
        if(ignoreChars(dir[0]))
            dir = dir.substr(1,dir.length-1);
        else 
            break;
    }

    // ends with
    while(dir.length > 0){
        let lst = dir.length - 1;

        if(ignoreChars(dir[lst]))
            dir = dir.substr(0,lst-1);
        else 
            break;
    }

    return dir;
}

function readLocalTxt(str){
    for(let line of str.split('\n')){
        let spl = line.split('=>');

        let origin = trimDir(spl[1]);
        let module = trimDir(spl[0]);

        mods[module] = {
            module,
            origin
        };
    }
}

try {
    let fn = cwd+"/local-linked-modules.txt";
    if (fs.existsSync(fn)) {
        let txt = fs.readFileSync(fn).toString();
        readLocalTxt(txt);
    }
} catch(err) {
    console.error("module-linker error:", err);
}

console.log(mods);