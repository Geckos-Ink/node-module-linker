const fs = require('fs-extra')
const watch = require('node-watch');
const dircompare = require('dir-compare');

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
/// Extensions
///
if(!String.prototype.replaceAll){
    String.prototype.replaceAll = function(from, to){
        return this.split(from).join(to);
    }
}


///
/// Begin the modules sync
///
console.log(mods);

for(let m in mods){
    let mod = mods[m];

    // If not exist, simply copy it
    if(!fs.existsSync(mod.module)){
        // To copy a folder or file, select overwrite accordingly
        try {
            fs.copySync(mod.origin, mod.module, { overwrite: false });
            console.log('success!')
        } catch (err) {
            console.error(err)
        }

        //TODO: execute git add module command if git
    }
    else {
        ///
        /// Watch differences
        ///

        const options = {
            excludeFilter: ".git,node_modules",
            compareContent: true,
            compareFileSync: dircompare.fileCompareHandlers.lineBasedFileCompare.compareSync,
            compareFileAsync: dircompare.fileCompareHandlers.lineBasedFileCompare.compareAsync,
            ignoreLineEnding: true,      // Ignore crlf/lf line ending differences
            ignoreWhiteSpaces: true,     // Ignore white spaces at the beginning and ending of a line (similar to 'diff -b')
            ignoreAllWhiteSpaces: true,  // Ignore all white space differences (similar to 'diff -w')
            ignoreEmptyLines: true       // Ignores differences caused by empty lines (similar to 'diff -B')
        };

        let alreadyWorkingOn = false;
        function dirsCompareAndCopy(){
            if(alreadyWorkingOn) return;
            alreadyWorkingOn = true;

            let dirsAlreadyDone = [];

            dircompare.compare(mod.origin, mod.module, options)
            .then((res) => {
                let dset = res.diffSet;
                for(var file of dset){
                    let name = file.name1 || file.name2;
                    let baseDir = file.relativePath;
                    let type = (file.type1 == 'missing' ? undefined : file.type1) || file.type2;
                    let dateOrigin = file.date1 || new Date(0);
                    let dateModule = file.date2 || new Date(0);
                    let path = (baseDir.replaceAll('\\','/') + '/' + name).replaceAll('//','/');

                    let mostRecentDate = dateOrigin > dateModule ? dateOrigin : dateModule;

                    if(file.state != 'equal'){
                        let yetDone = false;

                        for(let dirDone of dirsAlreadyDone){
                            if(path.startsWith(dirDone)){
                                yetDone = true;
                                break;
                            }
                        }

                        if(!yetDone){
                            let from    = (dateOrigin > dateModule ? mod.origin : mod.module) + path;
                            let to      = (dateOrigin > dateModule ? mod.module : mod.origin) + path;

                            fs.copySync(from, to, { overwrite: true });
                            console.log(from, "copied to", to);

                            if(type == 'dir')
                                dirsAlreadyDone.push(path);
                        }
                    }
                }

                alreadyWorkingOn = false;
            })
            .catch((error) => {
                console.error(error);
                alreadyWorkingOn = false;
            });
        }

        watch(mod.origin, { recursive: true }, function(evt, name) {
            dirsCompareAndCopy();
        });
    
        watch(mod.module, { recursive: true }, function(evt, name) {
            dirsCompareAndCopy();
        });
    }


}