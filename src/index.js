const fs = require('fs-extra')
const watch = require('node-watch');
const dircompare = require('dir-compare');

const dirsPool = require('./dirsPool');

///
/// General functions
///

function prettyDir(dir){
    return dir.replaceAll('\\','/').replaceAll('//','/');
}

///
/// Let's go
///

const cwd = process.cwd();
global.talker = false;
let justExec = true;

let notDefaultArgs = false;

let args = [...process.argv].splice(2);
for(let arg of process.argv){ // set talket true if requested in arguments
    if(arg == '--modules-sync-talker'){
        global.talker = true;
    }
    else if(arg == '.'){
        justExec = false;
        dirsPool.remember(cwd);
    }
    else if(arg == 'run'){
        justExec = false;

        const child_process = require('child_process');
        
        for(var dir of dirsPool.list()){
            const child = child_process.execFile(
                process.execPath,
                finalArgs,
                {
                env: process.env,
                cwd: process.cwd(),
                stdio: 'inherit'
                }, (e, stdout, stderr) => {
                console.log('process completed');
                if (e) {
                    process.emit('uncaughtException', e);
                }
            });
          
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        }
    }  
    else 
        notDefaultArgs = true;   
}

if(notDefaultArgs && fs.existsSync(args[0])){
    process.chdir(args[0]);
}

function exec(){
    require('./extensions');
    const ModuleDB = require('./moduleDb');

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
                dir = dir.substr(0,lst);
            else 
                break;
        }

        return dir;
    }

    function readLocalTxt(str){
        for(let line of str.split('\n')){
            try{
                let spl = line.split('=>');

                if(spl.length>1){
                    let origin = trimDir(spl[1]);
                    let module = trimDir(spl[0]);

                    mods[module] = {
                        module,
                        origin
                    };
                }
            }
            catch {
                console.error("modules-sync: error reading local-linked-modules.txt line ", line);
            }
        }
    }

    let fn = cwd+"/local-linked-modules.txt";

    try {    
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
    console.log("modules-sync: loaded modules from "+prettyDir(fn)+" ", mods);

    for(let m in mods){
        let mod = mods[m];

        mod.db = new ModuleDB(cwd + '/' + mod.module);

        // If not exist, simply copy it
        if(!fs.existsSync(mod.module)){
            // To copy a folder or file, select overwrite accordingly
            try {
                fs.copySync(mod.origin, mod.module, { overwrite: false });
                console.log('success', prettyDir(mod.module), 'creation');
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

            let dirsAlreadyDone = [];
            let alreadyWorkingOn = false;
            function dirsCompareAndCopy(){

                if(alreadyWorkingOn) return;
                alreadyWorkingOn = true;

                try{

                    res = dircompare.compareSync(mod.origin, mod.module, options);

                    let dset = res.diffSet;
                    for(var file of dset){
                        let name = file.name1 || file.name2;
                        let baseDir = file.relativePath;
                        let type = (file.type1 == 'missing' ? undefined : file.type1) || file.type2;
                        let dateOrigin = file.date1 || new Date(0);
                        let dateModule = file.date2 || new Date(0);
                        let path = (baseDir.replaceAll('\\','/') + '/' + name).replaceAll('//','/');

                        //let mostRecentDate = dateOrigin > dateModule ? dateOrigin : dateModule;
                        let dbFile = mod.db.getFile(path);
                        
                        let notDeleted = true;

                        if(file.state != 'equal'){
                            
                            // Check if deleted
                            if(file.type1=='missing' || file.type2=='missing'){

                                if(dbFile){
                                    if(dateOrigin <= dbFile.date1 && dateModule <= dbFile.date2){
                                        // file deleted
                                        let whereToDelete = (file.type1 == 'missing' ? mod.module : mod.origin) + path;
                                        
                                        console.log("Deleted", prettyDir(path), "removing also", prettyDir(whereToDelete));

                                        fs.removeSync(whereToDelete);
                                        mod.db.removeFile(dbFile.id);

                                        notDeleted = false;
                                    }
                                }
                            }

                            if(notDeleted){
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
                                    console.log(prettyDir(from), "copied to", prettyDir(to));

                                    if(type == 'dir')
                                        dirsAlreadyDone.push(path);
                                }
                            }
                        }

                        if(notDeleted){
                            let date1 = file.date1 || file.date2;
                            let date2 = file.date2 || file.date1;

                            if(!dbFile || dbFile.date1 != date1 || dbFile.date2 != date2)
                                mod.db.setFileDate(path, date1, date2);
                        }
                    }

                    alreadyWorkingOn = false;
                }
                catch(ex){
                    console.error("Error on module", prettyDir(mod.module), "\r\n", ex);
                    alreadyWorkingOn = false;
                }
            }

            dirsCompareAndCopy();

            watch(mod.origin, { recursive: true }, function(evt, name) {
                dirsCompareAndCopy();
            });
        
            watch(mod.module, { recursive: true }, function(evt, name) {
                dirsCompareAndCopy();
            });
        }


    }
}

if(justExec)
    exec();