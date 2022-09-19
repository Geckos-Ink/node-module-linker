const sqlite3 = require('better-sqlite3');

class ModuleDB {
    constructor(module){
        let dirDB = __dirname + '/DBs/mod_' + module.replaceAll(':','').replaceAll('\\','-').replaceAll('/','-').replaceAll('--','-').replaceAll('--','-')+'.db';

        if(global.talker) console.log('dirDB', dirDB);
        
        this.db = sqlite3(dirDB, { verbose: global.talker ? console.log : undefined });
        this._prepareTable();
    }

    _prepareTable(){
        let create = this.db.prepare(`
            CREATE TABLE [IF NOT EXISTS] files (
                id INTEGER PRIMARY KEY,
                fileName TEXT NOT NULL,
                date1 INTEGER,
                date2 INTEGER
            );
        `);

        create.run();
    }

    getFile(path){
        const stmt = db.prepare('SELECT * FROM files WHERE fileName=(?)');
        let file = stmt.run(path).get();

        if(file){
            file.date1 = new Date(file.date1);
            file.date2 = new Date(file.date2);
        }

        return file;
    }

    setFileDate(path, date1, date2=null){
        let file = this.getFile(path);
        if(file){ // update
            let stmt = db.prepare('UPDATE files SET date1=?, date2=? WHERE id=?');
        }
        else { // insert into
            let stmt = db.prepare('INSERT INTO files (fileName, date1, date2) VALUES (?, ?, ?)');
            let info = stmt.run(path, date1, date2);
            // info.changes
        }
    }
}

module.exports = ModuleDB;