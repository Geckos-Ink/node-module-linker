const sqlite3 = require('better-sqlite3');

class ModuleDB {
    constructor(module){
        let dirDB = __dirname + '/DBs/' + module.replaceAll('\\','-').replaceAll('/','-');
    }
}

module.exports = ModuleDB;