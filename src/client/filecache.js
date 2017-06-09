// File Cache for Static Analys and Searching 
import Dexie from "https://unpkg.com/dexie@2.0.0-beta.11/dist/dexie.js"
import Strings from "src/client/strings.js"
import {babel} from 'systemjs-babel-build';

export default class FileCache {
  
  static current() {
    if (!this._current) {
      this._current = new FileCache("file_cache")
    }
    return this._current
  }
  
  toString() {
    return "["+this.name+":FileCache]"
  }
  
  clear() {
    this.db.files.clear()
    // this.db.delete()
  }
  
  constructor(name) {
    this.name = name
    this.db = this.fileCacheDB()
  }
  
  fileCacheDB() {
    var db = new Dexie(this.name);
    db.version(1).stores({
        files: 'url,name,type,content,version,options,title,tags,classes,functions'
    })
    return db
  }
  
  async toArray() {
    return this.db.files.where("name").notEqual("").toArray()
  }
  
  async update() {
    this.db.files.where("name").notEqual("").modify(function(ea) {
       this.extractTitleAndTags(ea)
    })
    this.db.files.where("type").equal("js").modify(function(ea) {
      this.extractFunctionsAndClasses(ea)
    })
  }

  extractTitleAndTags(file) {
    file.title = file.content.split("\n")[0].replace(/## /,"") 
    file.tags = Strings.matchAll('#[A-Za-z0-9]+', file.content)
  }
  
  extractFunctionsAndClasses(file) {
    // lively.notify("file " +file.url + " " + file.content.length)
    var ast = this.parseSource(file.url, file.content)
    var result = this.parseFunctionsAndClasses(ast)
    // lively.notify("result " + result.functions)
    file.classes = result.classes
    file.functions  = result.functions
    console.log("classes " + file.classes)
  }
  
  parseFunctionsAndClasses(ast) {
    var functions = []
    var classes = []
    babel.traverse(ast,{
      Function(path) {
        if (path.node.key) {
          functions.push(path.node.key.name)
        } else if (path.node.id) {
          functions.push(path.node.id.name)
        }
      },
      ClassDeclaration(path) {
        if (path.node.id) {
          classes.push(path.node.id.name)
        }
      }
    })
    return {functions, classes}
  }

  parseSource(filename, source) {
    return babel.transform(source, {
        babelrc: false,
        plugins: [],
        presets: [],
        filename: filename,
        sourceFileName: filename,
        moduleIds: false,
        sourceMaps: true,
        compact: false,
        comments: true,
        code: true,
        ast: true,
        resolveModuleSource: undefined
    }).ast
  }
  

  async addDirectory(baseURL, depth) {
    console.log("addDirectory " + baseURL + " "  + depth)
    var contents = (await fetch(baseURL, {method: "OPTIONS"}).then( resp => resp.json())).contents
    for(let ea of contents) {
      let eaURL = baseURL.replace(/\/$/,"")  + "/" + ea.name
      let name = eaURL.replace(/.*\//,"")
      let size = ea.size;
      if (name.match(/^\./)) {
        console.log("ignore hidden file " + eaURL)
        continue
      };
      
      if (ea.type == "directory" && (depth > 0)) {
        console.log("[file cache] decent recursively: " + eaURL )
        this.addDirectory(eaURL, depth - 1)
      }
      
      
      if (await this.db.files.where("url").equals(eaURL).first()) {
        console.log("already in cache: " + eaURL)
      } else {
        if (!name.match(/\.((css)|(js)|(md)|(txt)|(x?html))$/)) {
          console.log("ignore " + eaURL)
          continue
        };
        
        if (size > 100000) {
          console.log("ignore " + eaURL + ", due to oversize " + Math.round (size/1000) + "kb")
          continue
        }

        console.log("load " + eaURL)
        // await new Promise(resolve => setTimeout(resolve, 100))
        
        // let options = await fetch(eaURL, 
        //  {method: "OPTIONS", headers: {showversions: true}}).then(resp => resp.json())
        //  versions: options.versions
        let response = await fetch(eaURL)
        let version = response.headers.get("fileversion")
        let contents = await response.text() 
  
  
        let type = eaURL.replace(/.*\./,"")
        if(ea.type == "directory") {
          type = "directory"
        }
        var file = {
          url: eaURL, 
          name: name, 
          size: size,
          type: type, 
          content: contents, 
          version: version}
        this.extractTitleAndTags(file)
        if (file.type == "js") {
          this.extractFunctionsAndClasses(file)
        }
        this.db.transaction("rw", this.db.files, () => {
          this.db.files.put(file)
        })
      }

      
    }
  }
  

  showAsTable() {
    var result= []
    this.db.files.each(ea => {
      result.push(
        {url:ea.url, 
        size: ea.content.length, 
        title: ea.title.replace(/</g, "&lt;").slice(0,100), 
        tags: ea.tags,
        classes: ea.classes,
        functions: ea.functions
        })
    }).then(() => {
      var sorted = _.sortBy(result, ea => Number(ea.size)).reverse()
      
      lively.openComponentInWindow("lively-table").then(table => {
        table.setFromJSO(sorted)
        table.style.overflow = "auto"
        table.column("size").forEach(cell => cell.classList.add("number"))
      })
      console.log("result: " + result.length)
    })
  }
}