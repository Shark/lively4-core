import HaloItem from './HaloItem.js';
import componentLoader from "src/client/morphic/component-loader.js";

export default class HaloInspectItem extends HaloItem {
  
    onClick(evt) {
      var inspectTarget = window.that;

      lively.openInspector(inspectTarget, 
          undefined, undefined,  
          // lively.findWorldContext(inspectTarget)
          )    
      
      // if (evt.shiftKey) {
      // } else {
      //   lively.openComponentInWindow('lively-object-editor', undefined, undefined, 
      //     lively.findWorldContext(inspectTarget)).then((editor) => {
      //     editor.targetElement    = inspectTarget;
        
          
         
      //   });
      // }
      this.hideHalo();
    }
}