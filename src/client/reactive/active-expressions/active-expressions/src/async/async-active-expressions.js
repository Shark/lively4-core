import { BaseActiveExpression } from '../base/base-active-expressions.js';

export class AsyncActiveExpression extends BaseActiveExpression {
  async getCurrentValue() {
    var valueOrPromise = this.func(...(this.params));
    return Promise.resolve(valueOrPromise);
  }
}
