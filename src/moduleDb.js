const sqlite3 = require('better-sqlite3');
const fs = require('fs-extra');

function verboseLog(what){
    if(global.talker)
        console.log(what);
}

class ModuleDB {
    constructor(module){
        const baseDbDir = __dirname + '/DBs';

        if(!fs.existsSync(__dirname))
            fs.mkdir(baseDbDir);

        let dirDB = baseDbDir + '/mod_' + module.replaceAll(':','').replaceAll('\\','-').replaceAll('/','-').replaceAll('--','-').replaceAll('--','-')+'.db';

        if(global.talker) console.log('dirDB', dirDB);
        
        this.db = sqlite3(dirDB, { verbose: verboseLog });
        this._prepareTable();
    }

    _prepareTable(){
        let create = this.db.prepare(`CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY,
            fileName TEXT NOT NULL,
            date1 INTEGER,
            date2 INTEGER
        )`);

        create.run();
    }

    getFile(path){
        const stmt = this.db.prepare('SELECT * FROM files WHERE fileName=?');
        let file = stmt.get(path);

        if(file){
            file.date1 = new Date(file.date1);
            file.date2 = new Date(file.date2);
        }

        return file;
    }

    setFileDate(path, date1, date2){
        let file = this.getFile(path);

        date1 = date1.getTime();
        date2 = date2.getTime();

        if(file){ // update
            let stmt = this.db.prepare('UPDATE files SET date1=?, date2=? WHERE id=?');
            let info = stmt.run(date1, date2, file.id)
            // info.changes
        }
        else { // insert into
            let stmt = this.db.prepare('INSERT INTO files (fileName, date1, date2) VALUES (?, ?, ?)');
            let info = stmt.run(path, date1, date2);
            // info.changes
        }
    }

    removeFile(id){
        const stmt = this.db.prepare('DELETE FROM files WHERE id=?');
        stmt.run(id);
    }
}

module.exports = ModuleDB;