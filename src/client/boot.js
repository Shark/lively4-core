/**
 * boot.js -- loads lively in any page that inserts throug a script tag
 *
 **/
 
/*
 #TODO refactor booting/loading/init of lively4
  - currently we have different entry points we should unify
 */
 
if (window.lively && window.lively4url) {
  console.log("CANCEL BOOT Lively4, because it is already loaded")
} else {
 
  console.group("BOOT")
  
  // for finding the baseURL...
  var script = document.currentScript
  var scriptURL = script.src;
  window.lively4url = scriptURL.replace("/src/client/boot.js","")
  
  var loadContainer = script.getAttribute("data-container") // some simple configuration 
  console.log("lively4url: " + lively4url);
  
   
  // COPIED HERE BECAUSE resuse through libs does not work yet
  function loadJavaScriptThroughDOM(name, src, force) {
    return new Promise(function (resolve) {
      var scriptNode = document.querySelector(name);
      if (scriptNode) {
        scriptNode.remove();
      }
      var script = document.createElement("script");
      script.id = name;
      script.charset = "utf-8";
      script.type = "text/javascript";
      script.setAttribute("data-lively4-donotpersist","all");
      if (force) {
        src += +"?" + Date.now();
      }
      script.src = src;
      script.onload = function () {
        resolve();
      };
      document.head.appendChild(script);
    });
  }
  
  Promise.resolve().then( () => {
    return loadJavaScriptThroughDOM("systemjs", lively4url + "/src/external/systemjs/system.src.js");
  }).then(async () => {
    window._recorder_ = {_module_:{}}
    
    System.trace = true; // does not work in config
    
    // config for loading babal plugins
    SystemJS.config({
      baseURL: lively4url + '/', // needed for global refs like "src/client/lively.js", we have to refactor those before disabling this here. #TODO #Discussion
      babelOptions: {
        // stage2: false,
        // stage3: false,
        // es2015: false,
        // stage0: true,
        // stage1: true
        //presets: [
        //    ["es2015", { "loose": true, "modules": false }]
        //],
        plugins: []
      },
      meta: {
        '*.js': {
          babelOptions: {
            es2015: false,
            stage2: false,
            stage3: false,
            plugins: []
          }
        }
      },
      map: {
        // #Discussion have to use absolute paths here, because it is not clear what the baseURL is
        'plugin-babel': lively4url + '/src/external/babel/plugin-babel2.js',
        'systemjs-plugin-babel': lively4url + '/src/external/babel/plugin-babel.js',
        'systemjs-babel-build': lively4url + '/src/external/babel/systemjs-babel-browser.js',
        'kernel': lively4url + '/src/client/legacy-kernel.js',
        'babel-plugin-doit-result': lively4url + '/src/external/babel-plugin-doit-result.js',
        'babel-plugin-doit-this-ref': lively4url + '/src/external/babel-plugin-doit-this-ref.js',
        'babel-plugin-locals': lively4url + '/src/external/babel-plugin-locals.js',
        'babel-plugin-var-recorder': lively4url + '/src/external/babel-plugin-var-recorder.js',
        'workspace-loader': lively4url + '/src/client/workspace-loader.js'
      },
      trace: true,
      transpiler: 'plugin-babel'
    })
    
    await System.import('babel-plugin-doit-result', scriptURL);
    await System.import('babel-plugin-doit-this-ref', scriptURL);
    await System.import('babel-plugin-locals', scriptURL);
    await System.import('babel-plugin-var-recorder', scriptURL);
    
    SystemJS.config({
      meta: {
        '*.js': {
          babelOptions: {
            es2015: false,
            stage2: false,
            stage3: false,
            plugins: [
              'babel-plugin-locals',
              'babel-plugin-var-recorder'
            ]
          }
        }
      },
      
      'workspace:*': {
        babelOptions: {
          es2015: false,
          stage2: false,
          stage3: false,
          plugins: [
            'babel-plugin-locals',
            'babel-plugin-doit-result',
            'babel-plugin-doit-this-ref',
            'babel-plugin-var-recorder'
          ]
        },
        loader: 'workspace-loader'
      }
    });

    try {
      let { whenLoaded } = await System.import(lively4url + "/src/client/load.js")
      
      console.group("1/3: Wait for Service Worker...")
      await new Promise(whenLoaded);
      console.groupEnd();
      
      console.group("2/3: Look for uninitialized instances of Web Compoments");
      await lively.components.loadUnresolved();
      console.groupEnd();
      
      console.group("3/3: Initialize Document")
      await lively.initializeDocument(document, window.lively4chrome, loadContainer);
      console.groupEnd();
      
      console.log("Finally loaded!");
      
      document.dispatchEvent(new Event("livelyloaded"))
      
      console.groupEnd(); // BOOT
    } catch(err) {
      console.error("Lively Loading failed");
      console.error(err);
      alert("load Lively4 failed:" + err);
    }
  });
}
