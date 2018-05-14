"enable aexpr";

import Morph from'src/components/widgets/lively-morph.js';

export default class LivelyMpm extends Morph {
  async initialize() {
    this.windowTitle = "Lively Material Point Method Demo";
    this.registerButtons()
    this.time = 1;

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    lively.addEventListener("template", this, "dblclick", 
      evt => this.onDblClick(evt));
     
    this.canvas = this.get("#mpm");
    this.speedInput = this.get("#speed");
    this.youngInput = this.get("#young-modulus");
    this.extendInput = this.get("#extend");
    this.numParticlesInput = this.get("#num-particles");
    this.particleSizeInput = this.get("#particle-size");
    this.animation = new VibratingPoint();
    this.particleSize = 2;

    $(this.speedInput).keyup(event => {
      if (event.keyCode != 13) return; // ENTER
      this.speed = this.speedInput.value;
      // Resets particles
      this.animation.numParticles = this.animation.numParticles;
    });
    
    $(this.youngInput).keyup(event => {
      if (event.keyCode != 13) return; // ENTER
      this.young = this.youngInput.value;
      // Resets particles
      this.animation.numParticles = this.animation.numParticles;
    });
    
    $(this.extendInput).keyup(event => {
      if (event.keyCode != 13) return; // ENTER
      this.extend = this.extendInput.value;
      // Resets particles
      this.animation.numParticles = this.animation.numParticles;
    });
    
    $(this.numParticlesInput).keyup(event => {
      if (event.keyCode != 13) return; // ENTER
      this.animation.numParticles = this.numParticlesInput.value;
    });
    
    $(this.particleSizeInput).keyup(event => {
      if (event.keyCode != 13) return; // ENTER
      this.particleSize = this.particleSizeInput.value;
    });
    
    this.context = this.canvas.getContext("2d");
    this.context.fillStyle = "rgba(" + 255 + "," + 0 + "," + 0 + "," + 1 + ")";
    
    // Start animating
    new Promise(() => this.animation.execute(this));
  }
  
  draw(particles) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0; i < particles.length; ++i) {
      //console.log("width: ", particles[i] + (this.canvas.width / 2) - 50);
      //console.log("height: ", (this.canvas.height / particles.length) * (i + 1));
      this.context.fillRect(particles[i] + (this.canvas.width / 2) - (this.animation.L / 2), (this.canvas.height / (particles.length + 1)) * (i + 1), this.particleSize, this.particleSize);
    }
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    
  }

  /* Lively-specific API */

  livelyPreMigrate() {
    
  }
  
  livelyMigrate(other) {
    
  }
  
  livelyInspect(contentNode, inspector) {
    
  }
  
  livelyPrepareSave() {
    
  }
  
  
  async livelyExample() {
    // Add mpm data here later
  }
  
  
}

class VibratingPoint {
  set numParticles(value) {
    this.running = false;
    this._numParticles = value;
    this.particles.length = 0;
    this.q.length = 0;
    this.s.length = 0;
    this.vp.length = 0;
    
    for (let i = 0; i < this._numParticles; ++i) {
      this.particles.push(0.5 * this.L);
      this.q.push(this.standardQ);
      this.s.push(this.standardS);
      this.vp.push(this.standardVp);
    }
    
    this.running = true;
    return this._numParticles;
  }
  
  get numParticles() {
    return this._numParticles;
  }
  
  async execute(caller) {
    const Mp = 1;
    const Vp = 1;
    
    // Parameters
    // Young's modulus
    let E = 0.001 * Math.PI * Math.PI;
    this.L = 200;
    let dtime = 20;
    
    this.standardS = 0;
    let nodes = [1, 100];   
    this.standardVp = 0.1;
    this.standardQ = Mp * this.standardVp;
    
    this.particles = [];
    this.q = [];
    this.s = [];
    this.vp = [];
    this.numParticles = 1;
    
    while (1) {
      if (!this.running) continue;
      
      E = caller.young != null ? caller.young * Math.PI * Math.PI : E;
      this.L = caller.extend != null ? caller.extend : this.L;
      dtime = caller.speed != null ? caller.speed : dtime;
      
      for (let i = 0; i < this.numParticles; ++i) {
        let N1 = 1 - Math.abs(this.particles[i] - nodes[0]) / this.L;
        let N2 = 1 - Math.abs(this.particles[i] - nodes[1]) / this.L;
        let dN1 = -1 / this.L;
        let dN2 = 1 /this.L;
        let m1 = N1 * Mp;
        let m2 = N2 * Mp;
        let mv1 = N1 * this.q[i];
        let mv2 = N2 * this.q[i];
        mv1 = 0;
        let fint1 = -Vp * this.s[i] * dN1;
        let fint2 = -Vp * this.s[i] * dN2;
        let f1 = fint1; 
        let f2 = fint2;
        f1 = 0;
        mv1 = mv1 + f1 * dtime;
        mv2 = mv2 + f2 * dtime;
        this.vp[i] = this.vp[i] + dtime * (N1* f1 / m1 + N2 * f2 / m2);
        this.particles[i] = this.particles[i] + dtime * (N1*mv1 / m1 + N2 *mv2 / m2);
        this.q[i] = Mp * this.vp[i];
        let v1 = N1 * Mp * this.vp[i] / m1;
        let v2 = N2 * Mp * this.vp[i] / m2;
        v1 = 0; 
        let Lp = dN1 * v1 + dN2 * v2; 
        let dEps = dtime * Lp; 
        this.s[i] = this.s[i] + E * dEps;
      }
      
      caller.draw(this.particles);

      await new Promise(resolve => setTimeout(resolve, caller.time)); 
    }
  }
}

lively.components.addTemplatePath(lively4url + "/doc/PX2018/project_2/")
lively.components.resetTemplatePathCache()