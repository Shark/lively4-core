import Preferences from "./../preferences.js";
// import... HaloService from /templates/classes/Halo.js

export default class Selecting {

  static shouldHandle(e) {
    return e.altKey && !HaloService.isDragging;
  }
  static load() {
     if (!window.lively) {
      return setTimeout(() => {Selecting.load()}, 100) // defere
    }
    // use capture to prevent the default behavior...
    lively.removeEventListener("selecting"); // in case of a reload
    // #UseCase #COP get rid of the explict "selecting" context/domain and replace it with the context of the module "Selecting.js"
    lively.addEventListener("selecting", document.documentElement, 'pointerdown', 
      (evt) => this.handleMouseDown(evt), true);
    lively.addEventListener("selecting", document.documentElement, 'pointerup', 
      (evt) => this.handleMouseUp(evt), true);
    lively.addEventListener("selecting", document.documentElement, 'click', 
      (evt) => this.handleSelect(evt), true);
  }

  static handleMouseDown(e) {
    // lively.showElement(e.path[0])
    
    if (this.shouldHandle(e)) {
  
   
      
      // lively.showElement(e.path[0])
    
      
      // if (e.path.find(ea => ea.tagName == "LIVELY-HALO")) {
      //   lively.notify("clicked on halo")
      //   this.hideHalos()
      //   e.stopPropagation();
      //   e.preventDefault();
      //   return
      // }
      
      // console.log("mouse down " + e.target.tagName)
      e.stopPropagation();
      e.preventDefault();
    }
  }

  static handleMouseUp(e) {
    if (this.shouldHandle(e)) {
      console.log("mouse up " + e.target.tagName)
      e.stopPropagation();
      e.preventDefault();
    } else {
      // if (e.path[0] == document.documentElement) {
      // lively.notify("path: " + e.path)
      if (e.path.find(ea => ea.isHaloItem)) {
        // lively.notify("we are doing someing")
      } else {
        this.hideHalos()
      }
    }
  }
  
  static isIgnoredOnMagnify(element) {
    
    return !((element instanceof HTMLElement) || (element instanceof SVGElement))
      || element instanceof ShadowRoot 
      || element instanceof HTMLContentElement 
      || element.getAttribute("data-is-meta") 
      || (element.isMetaNode && !element.isSelection)
      || (element.tagName == "I" && element.classList.contains("fa")) // font-awesome icons
      || (element.tagName == "A") // don't go into text, just structural 
      || element === window 
      || element === document 
      || element === document.body 
      || element === document.documentElement // <HTML> element
  }

  static slicePathIfContainerContent(path) {
    // Special treatment of content in lively-container
    var isContainer  = false;
    var containerIndex;
    var isContent = false;
    path.forEach((ea, index) => {
      if (ea.tagName == "LIVELY-CONTAINER") {
        isContainer = true
        containerIndex = index
      }
      if (ea.id == "container-content") {
        isContent = true
      }
    })
    // lively.notify("container " + isContainer  + " content " + isContent)
    // e.path.forEach(ea => lively.showElement(ea))
    if (isContainer && isContent) {
      // window.lastPath = e.path
      path = path.slice(0, containerIndex)
    }
    return path
  }
  
  static handleSelect(e) {
    // lively.notify("path " + e.path.map(ea => ea.tagName))

    
    if (this.shouldHandle(e)) { 
    // lively.showElement(e.path[0],1300).textContent = "path: " + e.path.map(ea => ea.tagName).join(",")

      
      var rootNode = this.findRootNode(document.body)
      var path = this.slicePathIfContainerContent(e.path);
      // workaround weird toplevel event issues... the halo should not get the event
      // lively.notify("path " + e.path.map(ea => ea.tagName))
      if (e.path.find(ea => ea.tagName == "LIVELY-HALO")) {
        path = this.lastPath || e.path
      }      
      this.lastPath = path
      path = path
        // .reverse()
        .filter(ea => ! this.isIgnoredOnMagnify(ea))
      
      if (e.shiftKey) {
        var idx = e.path.indexOf(document.body);
        path= path
      } else {
        // by default: don't go into the shadows
        path = path.filter(ea => rootNode === this.findRootNode(ea))
      }
      var target = path[0]
      this.onMagnify(target, e, path);     
      e.stopPropagation();
      e.preventDefault();        
    } else {
      // lively.focusWithoutScroll(document.body)
    }
  }
  
  static findRootNode(node) {
    if (!node.parentNode) return node
    return this.findRootNode(node.parentNode)
  }

  static onMagnify(target, e, path) {
    if (!target) {
      this.hideHalos()
      return 
    }
    var grabTarget = target;
    var that = window.that;
    
    // console.log("onMagnify " + grabTarget + " that: " + that);
    var parents = _.reject(path, 
        ea =>  this.isIgnoredOnMagnify(ea))
    if (that && this.areHalosActive()) {
      var index = parents.indexOf(that);
      grabTarget = parents[index + 1] || grabTarget;
    }
    // if there was no suitable parent, cycle back to the clicked element itself
    window.that = grabTarget;
    this.showHalos(grabTarget, parents || path);
  }



  static showHalos(el, path) {
    path = path || []
    
    // if (HaloService.lastIndicator) HaloService.lastIndicator.remove();
    // HaloService.lastIndicator = lively.showElement(el);
    if (!self.HaloService) return;
    
    if (HaloService.lastIndicator) {
      HaloService.lastIndicator.style.border = "1px dashed blue"
      HaloService.lastIndicator.querySelector("pre").style.color = "blue"

    //   var div = document.createElement("div")
    //   div.innerHTML = path.reverse().map(ea => (ea === el ? "<b>" : "") + (ea.tagName ? ea.tagName : "") + " " + (ea.id ? ea.id : "") 
    //     + " " + (ea.getAttribute && ea.getAttribute("class")) + (ea === el ? "</b>" : "")).join("<br>")
    //   this.lastIndicator.appendChild(div)
      
    //   div.style.fontSize = "8pt"
    //   div.style.color = "gray"
    }
    
    HaloService.showHalos(el, path);
  }

  static hideHalos() {
    if (!self.HaloService) return;
    HaloService.hideHalos();
  }

  static areHalosActive() {
    return HaloService.areHalosActive();
  }
}

Selecting.load()
