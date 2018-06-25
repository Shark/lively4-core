
export default class BlockNetworkView {
  constructor(blockchainNodeView) {
    this._nodeView = blockchainNodeView;

    this._displayedBlocks = [];
    this._newBlocks = [];
    this._nodeIndices = new Map();
  }
  
  addBlock(block) {
    this._newBlocks.push(block);
    return this;
  }
  
  addBlocks(blocks) {
    this._newBlocks = this._newBlocks.concat(blocks);
    return this;
  }
  
  draw() {
    this._constructNodes();
    this._constructLinks();
    this._nodeView.draw();
    
    this._displayedBlocks = this._displayedBlocks.concat(this._newBlocks);
    this._newBlocks = [];
  }
  
  _constructNodes() {
    this._newBlocks.forEach((block) => {
      this._nodeIndices.set(block.hash, this._nodeIndices.size);
      this._nodeView.addNode(
        {
          "name": block.displayName,
          "group": 1,
          "hash": block.hash
        }
      );
    });
  }
  
  _constructLinks() {
    this._newBlocks.forEach((target) => {
      const source = this._getBlock(target.previousHash);
      
      if (!source) {
        return;
      }
      
      this._nodeView.addLink(
        {
          "source": this._nodeIndices.get(source.hash),
          "target": this._nodeIndices.get(target.hash),
          "value": 1,
        }
      );
    });
  }
  
  _getBlock(blockHash) {
    const allBlocks = this._displayedBlocks.concat(this._newBlocks);
    let result = null;

    allBlocks.forEach((block) => {
      if (result || block.hash != blockHash) {
        return;
      }
      
      result = block; 
    });
    
    return result;
  }
}