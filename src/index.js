const fs = require('fs-extra')
const watch = require('node-watch');

let cwd = process.cwd();

let mods = {};

///
/// Read local-linked-modules.txt
///
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

///
/// Begin the modules sync
///
console.log(mods);

for(let m in mods){
    let mod = mods[m];

    if(!fs.existsSync(mod.module)){
        // To copy a folder or file, select overwrite accordingly
        try {
            fs.copySync(mod.origin, mod.module, { overwrite: true|false })
            console.log('success!')
        } catch (err) {
            console.error(err)
        }
    }

    watch(mod.origin, { recursive: true }, function(evt, name) {
        console.log('%s changed.', name);
    });
}