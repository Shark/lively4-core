import forge from 'node_modules/node-forge/dist/forge.min.js';
import TransactionOutput from './transactionOutput.js';

/**
  Intended usage:
  
  var outputs = new TransactionOutputCollection()
                    .add(receiver1, value1)
                    .add(receiver2, value2)
                    .add(receiver3, value3)
                    .finalize();
**/

export default class TransactionOutputCollection {
  constructor() {
    this._transactionOutputs = new Map();
    this._value = 0;
    this.hash = null;
  }
  
  get displayName() {
    if (!this.hash) {
      return "#NotAName";
    }
    
    return "#" + this.hash.digest().toHex().substring(0, 10);
  }
  
  add(receiverWallet, value) {
    if (this.isFinalized()) {
      return this;
    }
    
    const output = new TransactionOutput(receiverWallet, value);
    this._transactionOutputs.set(receiverWallet.hash, output);
    this._calculateValue();
    return this;
  }
  
  get value() {
    return this._value;
  }
  
  get(receiverHash) {
    return this._transactionOutputs.get(receiverHash);
  }
  
  finalize() {
    if (this.isFinalized()) {
      return this;
    }
    
    this.hash = this._hash();
    return this;
  }
  
  isFinalized() {
    return !!this.hash;
  }
  
  has(outputHash) {
    return this._transactionOutputs.has(outputHash);
  }
  
  _calculateValue() {
    this._value = Array.from(this._transactionOutputs.entries()).reduce((total, entry) => {
      return total + entry[1].value;
    }, 0);
  }
  
  _hash() {
    var sha256 = forge.md.sha256.create();
    return sha256.update(
      Array.from(this._transactionOutputs.keys()).join('')
    );
  }
}