// TODO: this is use to keep SystemJS from messing up scoping
// (BaseActiveExpression would not be defined in aexpr)
const HACK = {};

export class BaseActiveExpression {

  /**
   *
   * @param func (Function) the expression to be observed
   * @param ...params (Objects) the instances bound as parameters to the expression
   */
  constructor(func, ...params) {
    this.func = func;
    this.params = params;
    this.lastValue = this.getCurrentValue();
    this.callbacks = [];
    this._isDisposed = false;
  }

  /**
   * Executes the encapsulated expression with the given parameters.
   * aliases with 'now'
   * @public
   * @returns {*} the current value of the expression
   */
  async getCurrentValue() {
    return Promise.resolve(this.func(...(this.params)));
  }

  async getLastValue() {
    return Promise.resolve(this.lastValue);
  }

  /**
   * @public
   * @param callback
   * @returns {BaseActiveExpression} this very active expression (for chaining)
   */
  onChange(callback) {
    this.callbacks.push(callback);

    return this;
  }
  // #TODO: should this remove all occurences of the callback?
  offChange(callback) {
    var index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }

    return this;
  }

  /**
   * Signals the active expression that a state change might have happened.
   * Mainly for implementation strategies.
   * @public
   */
  async checkAndNotify() {
    let currentValue = await this.getCurrentValue();
    let lastValue = await this.getLastValue();
    if(lastValue === currentValue) { return; }

    this.lastValue = currentValue;

    this.notify(currentValue, {
      lastValue
    });
  }

  notify(...args) {
    this.callbacks.forEach(callback => callback(...args));
  }

  /**
   * TODO
   * like a bind for AExpr
   * @param items
   */
  applyOn(...items) {
    throw new Error('Not yet implemented');
  }

  async onBecomeTrue(callback) {
    // setup dependency
    this.onChange(bool => {
      if(bool) {
        callback();
      }
    });
    // check initial state
    if(await this.getCurrentValue()) {
      callback();
    }

    return this;
  }

  async onBecomeFalse(callback) {
    // setup dependency
    this.onChange(bool => {
      if(!bool) {
        callback();
      }
    });
    // check initial state
    if(!(await this.getCurrentValue())) {
      callback();
    }

    return this;
  }

  async nowAndOnChange(callback) {
    // setup dependency
    this.onChange(callback);

    // call immediately
    // #TODO: duplicated code: we should extract this call
    this.notify(await this.getCurrentValue(), {});

    return this;
  }
  
  dispose() {
    this._isDisposed = true;
  }

  /**
   * #TODO: implement
   * disposeOnLastCallbackDetached
   * chainable
   * for some auto-cleanup
   * (only triggers, when a callback is detached; not initially, if there are no callbacks)
   */
  disposeOnLastCallbackDetached() {
    throw new Error('Not yet implemented.')
  }
}

export function aexpr(func, ...params) {
  return new BaseActiveExpression(func, ...params);
}

export default BaseActiveExpression;

