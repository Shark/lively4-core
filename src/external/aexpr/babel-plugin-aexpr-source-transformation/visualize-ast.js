import d3 from 'src/external/d3.v4.js';

export default function d3visualize({ path, state, t, template, traverse }) {
  
  if(!that || that.tagName !== "DIV") { lively.notify("no vis"); return; }
  that.innerHTML = "";
  
  const width = that.clientWidth;
  const height = that.clientHeight;
  
  const svg = d3.select(that).append("svg");
  const graphContainer = svg.append("g");
  const zoomer = graphContainer.append("g");
  svg
    .attr("width", width)
    .attr("height", height);
  
  svg.call(d3.zoom()
			.duration(150)
    	//.scaleExtent([MIN_MAGNIFICATION, MAX_MAGNIFICATION])
      .on("zoom", () => graphContainer.attr("transform", d3.event.transform)));
  
  const astNodes = [];
  path.traverse({
    Identifier(path) {
      astNodes.push(path.node);
    }
  })
  lively.notify(astNodes.length);
  const astNodeContainer = zoomer.append("g");
  const nodes = astNodeContainer.selectAll("g")
    .data(astNodes).enter()
      .append("g")
      .attr("transform", d => `translate(${d.loc.start.column}, ${d.loc.start.line})`);
  nodes.append("circle")
      .attr("r", 0.5)
      .style('fill', 'white')
  nodes.append("text")
       .style("text-anchor", "middle")
       .style("alignment-baseline", "middle")
       .style("font-size", "0.5px")
       .text(d => d.name);
  const contentBox = svg.node().getBBox();
  zoomer.attr("transform", `translate(${-contentBox.x/2}, ${-contentBox.y/2})scale(${width/contentBox.width}, ${height/contentBox.height})`)
}