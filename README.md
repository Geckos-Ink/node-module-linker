# modules-sync

### Automatically synchronize modules or git submodules already present locally.
Useful if you are working to a project and at the same time to a its module or git submodule on the same computer.

**Version: 0.2.0**

## Install

#### Via NPM to your local package:

> `$ npm i modules-sync --save`

Then import at the beginning of your project for starting immediately to synchronize the modules:

```javascript
require('modules-sync'); // for the moment, no options are available
```

#### Via GitHub

> `$ npm i https://github.com/Geckos-Ink/node-modules-sync --save`

## Install globally

> `$ npm i modules-sync -g`

Then call it as service in the directory you need

> `~/MyProject$ modules-sync`

### local-linked-modules.txt example

Create it at the root of your project. Every line is reserved to a module:

```
modules/module/ => C:\GitHub\module\
modules/module2/ => D:\Gits\module2\
```

There are no differences between using slash or backslash in the module path, but is advised to use the operative system normal syntax in the origin path. Anyway, NodeJS is OS independent, it manages the difference automatically normally.

### Global register
You can add a directory to the global register for executing automatically multiple directories at the same time:
> `~/MyProject$ modules-sync .` # also **+** is accepted  

Then modules-sync will be executed in every registered directory launching the command anywhere:
> `$ modules-sync run`

You can remove a directory using the symbol argument **-**
> `~/MyProject$ modules-sync -`

You can check all registered directories using the argument **list** anywhere:
> `$ modules-sync list`

And you can remove (or add) a directory specifying **before the command** its path:
> `$ modules-sync ~/MyProject -`

### Notes

- You could use the argument option *--modules-sync-talker* for making verbose more as possible modules-sync

- **A lot of bugs are possible (these are the first releases). Open the issue at the project repository link**: [Issues · Geckos-Ink/node-modules-sync · GitHub](https://github.com/Geckos-Ink/node-modules-sync/issues). ***Thank you!***



#### todo:

- You have to manually add an external git repository as submodule inside a git repository
