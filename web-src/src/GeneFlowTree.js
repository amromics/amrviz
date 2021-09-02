/* eslint-disable */
import * as d3 from "d3";
import {
  NewickTools
} from "newick";
export class GeneFlowTree {
  nodes = [];
  links = [];
  constructor(element) {
    this.container = element;
    this.props = {
      width: this.container.clientWidth,
      height: 1200
    };
    this.treeview = document.createElement("div");
    this.treeview.id = "amr_gf_treeview";
    this.treeview.style.width = this.props.width + "px";
    this.treeview.style.height = this.props.height + "px";


    var control_div = document.createElement('div');
    control_div.style.width = (this.props.width) + "px";
    control_div.style.height = "40px";
    control_div.style.padding = "0px";
    control_div.style.margin = "0px";
    control_div.style.borderBottom = "1px solid #a6a6a6";

    var control_zoom = document.createElement('div');
    control_zoom.style.margin = "10px";
    control_zoom.style.float = "right";
    var control_zoom_in = document.createElement('button');
    control_zoom_in.style.backgroundImage = "none";
    control_zoom_in.style.border = "1px solid transparent";
    control_zoom_in.style.borderRadius = "4px";
    control_zoom_in.textContent = "+";
    control_zoom_in.addEventListener("click", this.zoomIn.bind(this));
    //control_zoom_in.addEventListener("click", this.zoomIn.bind(this));
    var control_zoom_out = document.createElement('button');
    control_zoom_out.style.backgroundImage = "none";
    control_zoom_out.style.border = "1px solid transparent";
    control_zoom_out.style.borderRadius = "4px";
    control_zoom_out.textContent = "-";
    control_zoom_out.addEventListener("click", this.zoomOut.bind(this));
    //  control_zoom_out.addEventListener("click", this.zoomOut.bind(this));
    control_zoom.appendChild(control_zoom_out);
    control_zoom.appendChild(control_zoom_in);
    // control_div.appendChild(control_zoom);
    this.control_gene = document.createElement('div');
    this.control_gene.style.margin = "10px";
    this.control_gene.style.float = "left";
    control_div.appendChild(this.control_gene);

    var control_option = document.createElement('div');
    this.control_gene.style.margin = "10px";
    this.control_gene.style.float = "right";






    control_div.appendChild(control_option);
    this.container.appendChild(control_div);
    this.container.appendChild(this.treeview);

    this.zoom_lv = 3;

    this.active_names = [];
    this.display_branch_length = true;
    this.nodes = [];
    this.links = [];
    this.allele_links = [];
    this.cell_size = 40;
    this.selectedNodes = new Set();
    this.svg = null;
    this.hl_links = [];
  }

  load(genelabel, species_tree, gene_tree) {

    //console.log(alignment);
    this.control_gene.innerHTML = genelabel;
    this.species_tree = species_tree;
    this.gene_tree = gene_tree;
    var newick_raw = species_tree;
    var newick_species = NewickTools.parse(newick_raw);
    let nodes_species = d3.hierarchy(newick_species, d => d.branchset);
    // console.log(nodes_species);
    var stack = [];
    nodes_species.height = 0;
    stack.push(nodes_species);
    let count = 0;
    var num_leaf = 0;
    this.node_leaf = [];
    this.arr_sample_from_tree = [];
    this.nodes = [];
    this.links = [];
    this.selectedNodes = new Set();
    this.allele_links = [];
    var max_heigth = 0;
    var max_depth = 0;
    let map_nodes = new Map();
    this.reverseMapNodes = new Map();
    while (stack.length > 0) {
      var n = stack.pop();
      n.id = count;
      count++;
      var newnode = { id: n.id, group: 0, type: 1, label: n.data.name, level: n.depth };
      if (n.children != undefined) {

        map_nodes.set(n.id, []);
        for (var i = 0; i < n.children.length; i++) {
          stack.push(n.children[i]);
          n.children[i].height = n.height + n.children[i].data.length;
        }
      } else {
        if (n.height > max_heigth) max_heigth = n.height;
        if (n.depth > max_depth) max_depth = n.depth;

        newnode.group = 1;
        this.node_leaf.push(newnode);
        num_leaf++;
      }
      this.nodes.push(newnode);
      if (n.parent != null) {
        this.links.push({ target: n.parent.id, type: 1, source: n.id, strength: 0.0 });
        let arr = map_nodes.get(n.parent.id);
        arr.push(newnode);
        map_nodes.set(n.parent.id, arr);
        this.reverseMapNodes.set(newnode.id, n.parent.id);
      }

    }

    //
    //estimate length of sample name, by average length plus 10
    var newick_gene = NewickTools.parse(gene_tree);
    let nodes_gene = d3.hierarchy(newick_gene, d => d.branchset);
   // console.log(nodes_gene);
    nodes_gene=this.simpleSortBaseonStrainOrder( this.node_leaf,nodes_gene);
    stack = [];
    var list_node_gene = [];
    nodes_gene.height = 0;
    stack.push(nodes_gene);

    var num_leaf_gene = 0;

    var max_depth_gene = 0;
    var map_nodes_gene = new Map();
    while (stack.length > 0) {
      var n = stack.pop();
      n.id = count;
      count++;
      var newnode = { id: n.id, group: 0, type: 2, label: n.data.name, level: n.depth };
      if (n.children != undefined) {

        map_nodes_gene.set(n.id, []);
        for (var i = 0; i < n.children.length; i++) {
          stack.push(n.children[i]);
          n.children[i].height = n.height + n.children[i].data.length;
        }
      } else {

        if (n.depth > max_depth_gene) max_depth_gene = n.depth;

        newnode.group = 1;
        num_leaf_gene++;

      }
      list_node_gene.push(newnode);
      if (n.parent != null) {
        this.links.push({ target: n.parent.id, type: 2, source: n.id, strength: 0.0 });
        let arr = map_nodes_gene.get(n.parent.id);
        arr.push(newnode);
        map_nodes_gene.set(n.parent.id, arr);
        this.reverseMapNodes.set(newnode.id, n.parent.id);
      }
    }
    //console.log( this.reverseMapNodes);
    //

    var width_tree = (this.props.width - 70) / 2;
    var distance_per_depth = width_tree / max_depth;
    var diff = width_tree + 20;
    var order = 1;
    for (var i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].group == 1) {
        var num_child = 0
        for (var j = 0; j < list_node_gene.length; j++) {

          var sample_name = list_node_gene[j].label.substring(0, list_node_gene[j].label.lastIndexOf("_"));


          if (list_node_gene[j].group == 1 && this.nodes[i].label == sample_name) {
            // console.log("found match");
            num_child++;

          }
        }
        this.nodes[i].fx = diff;


        // if(num_child>1){
        //    
        //   this.nodes[i].fy = (order * this.cell_size+ (order+num_child)* this.cell_size)/2;
        //    order=order+num_child+1;
        //  }        
        //  else{
        this.nodes[i].fy = order * this.cell_size;
        order = order + 1;
        // }
      }
    }
    var height = order * this.cell_size;
    this.container.style.height = (height + 100) + "px";
    //console.log(map_nodes);

    for (var d = max_depth; d >= 0; d--) {
      for (var i = 0; i < this.nodes.length; i++) {
        //console.log(this.nodes[i]);
        if (this.nodes[i].group == 0) {
          if (this.nodes[i].level == d) {
            var tb = 0;
            for (var c = 0; c < map_nodes.get(this.nodes[i].id).length; c++) {
              tb = tb + map_nodes.get(this.nodes[i].id)[c].fy;
            }
            //console.log(tb);  
            this.nodes[i].fy = tb / map_nodes.get(this.nodes[i].id).length;
            this.nodes[i].fx = distance_per_depth * d + 20;
          }
        }
      }
    }


    //width_tree=width_tree-100;
    distance_per_depth = (width_tree - 100) / max_depth_gene;
    var step_y = (height - this.cell_size) / num_leaf_gene;
    // console.log(height+","+num_leaf_gene);
    var order = 1;
    for (var i = 0; i < list_node_gene.length; i++) {
      for (var j = 0; j < this.node_leaf.length; j++) {

        var sample_name = list_node_gene[i].label.substring(0, list_node_gene[i].label.lastIndexOf("_"));
        //console.log(sample_name);

        if (list_node_gene[i].group == 1 && this.node_leaf[j].label == sample_name) {
          // console.log("found match");
          //count_gene++;
          list_node_gene[i].fx = this.node_leaf[j].fx + 100;
          //list_node_gene[i].fy = this.node_leaf[j].fy + (count_gene - t) * step_y;
          list_node_gene[i].fy = order * step_y;
          this.allele_links.push({ target: this.node_leaf[j].id, type: 2, source: list_node_gene[i].id, strength: 0.0 });
          order = order + 1;
        }
      }

    }
    for (var d = max_depth_gene; d >= 0; d--) {
      for (var i = 0; i < list_node_gene.length; i++) {
        //console.log(this.nodes[i]);
        if (list_node_gene[i].group == 0) {
          if (list_node_gene[i].level == d) {
            var tb = 0;
            for (var c = 0; c < map_nodes_gene.get(list_node_gene[i].id).length; c++) {
              tb = tb + map_nodes_gene.get(list_node_gene[i].id)[c].fy;
            }
            //console.log(tb);  
            list_node_gene[i].fy = tb / map_nodes_gene.get(list_node_gene[i].id).length;
            list_node_gene[i].fx = 2 * (width_tree - 50) - distance_per_depth * d + 100;
          }
        }
      }
    }


    //console.log(map_nodes);


    Array.prototype.push.apply(this.nodes, list_node_gene)

    this.make_square_view(this.nodes, this.links);

  }
  simpleSortBaseonStrainOrder(strain_nodes, gene_tree) {
    //hash order of strain nodes
    var true_order = new Map();
    for (var i = 0; i < strain_nodes.length; i++) {
      true_order.set(strain_nodes[i].label, i);
    }
   // console.log(true_order);
    //check every leaf nodes in gene tree, sort order of leaf nodes have same parent
    var stack = [];
    stack.push(gene_tree);


    
    while (stack.length > 0) {
      var n = stack.pop();
      if (n.children != undefined) {
        for (var i = 0; i < n.children.length; i++) {
          stack.push(n.children[i]);
        }
       
        for (var i = 0; i < n.children.length-1; i++) {
         
         
          for(var j=i+1;j<n.children.length;j++){
            var sample_name_i = n.children[i].data.name.substring(0, n.children[i].data.name.lastIndexOf("_"));
            var sample_name_j = n.children[j].data.name.substring(0, n.children[j].data.name.lastIndexOf("_"));
            if(true_order.get(sample_name_i)!=undefined  && true_order.get(sample_name_j)!=undefined){
              if(true_order.get(sample_name_i)< true_order.get(sample_name_j)){
                //swap
                let t=n.children[i];
                n.children[i]=n.children[j];
                n.children[j]=t;
                //console.log("swap:"+sample_name_i+":"+true_order.get(sample_name_i)+","+sample_name_j+":"+true_order.get(sample_name_j));
                
              }
            }
          }
         
        }

      } 
    }
    //console.log(gene_tree);
    return  gene_tree;
  }
  getChildNodes(parentNode, linkes) {

    for (var i = 0; i < this.links.length; i++) {

    }
  }
  make_square_view(nodes, links) {
    var square_links = [];
    var middle_nodes = [];
    for (var i = 0; i < links.length; i++) {
      var source_node;
      var target_node;
      for (var j = 0; j < nodes.length; j++) {
        if (links[i].source == nodes[j].id)
          source_node = nodes[j];
        if (links[i].target == nodes[j].id)
          target_node = nodes[j];
      }
      var midder_node = { id: source_node.id + "_" + target_node.id, group: source_node.group, type: 0, label: "", level: source_node.level };
      midder_node.fx = target_node.fx;
      midder_node.fy = source_node.fy;
      middle_nodes.push(midder_node);
      square_links.push({ target: midder_node.id, type: links[i].type, source: source_node.id, strength: 0.0 });
      square_links.push({ target: target_node, type: links[i].type, source: midder_node.id, strength: 0.0 });
    }
    this.links = square_links;

    Array.prototype.push.apply(nodes, middle_nodes)

  }
  logscale(min_value, max_value, max_scale, v) {
    if (v == 0) return 0;
    //change range to make sure all value greater 1
    let mul = Math.pow(10, -Math.log10(min_value));
    max_value = mul * max_value;
    v = mul * v;
    let k = max_scale / Math.log10(max_value);
    return k * Math.log10(v);
  }
  setOptions(options) {
    this.props.width = options.width;
    this.props.height = options.height;

  }
  setActiveNames(names) {
    this.active_names = names;
    this.drawHighlighTree();
  }
  drawHighlighTree() {
    this.selectedNodes = new Set();
    //(this.active_names);
    for (var i = 0; i < this.node_leaf.length; i++) {
      if (this.active_names.includes(this.node_leaf[i].label)) {
        this.selectedNodes.add(this.node_leaf[i].id);
      }
    }
    this.drawSelectNdoe();
  }
  draw() {

    var width = this.props.width,
      height = this.container.style.height;
    this.treeview.innerHTML = "";
    this.svg = d3.select("#amr_gf_treeview").append("svg")
      .attr("width", width)
      .attr("height", height);
    //console.log(svg);
    var linkForce = d3
      .forceLink()
      .id(function (link) { return link.id })
      .strength(function (link) { return link.strength })

    this.simulation = d3
      .forceSimulation()
      .force('link', linkForce)
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2))
    var s = this.simulation;
    var dragDrop = d3.drag().on('start', function (node) {
      node.fx = node.x
      node.fy = node.y
    }).on('drag', function (node) {
      s.alphaTarget(0.7).restart()
      node.fx = d3.event.x
      node.fy = d3.event.y
    }).on('end', function (node) {
      if (!d3.event.active) {
        s.alphaTarget(0)
      }

      node.fixed = true
    })
    this.linkElements = this.svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(this.links)
      .enter().append("line")
      .attr("stroke-width", this.getLinkStroke)
      .attr("stroke-linecap", "round")
      .attr("stroke", this.getLinkColor)
    this.linkHighlightElements = this.svg.append("g")
      .attr("class", "hl_node_links")
      .selectAll("line")
      .data(this.links)
      .enter().append("line")
      .attr("stroke-width", "0")
      .attr("stroke-linecap", "round")
      .attr("stroke", this.getHighlightLinkColor)
    this.linkAlleleElements = this.svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(this.allele_links)
      .enter().append("line")
      .attr("stroke-width", 0)
      .attr("stroke-linecap", "round")
      .attr("stroke", "#66666666")
    this.hightlight_overlay = this.svg.append("g")
      .attr("class", "hl_link")
      .selectAll("line")
      .data(this.allele_links)
      .enter().append("line")
      .attr("stroke-width", 0)
      .attr("stroke-linecap", "round")
      .attr("stroke", "#811112")

    this.nodeElements = this.svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(this.nodes)
      .enter().append("circle")
      .attr("r", this.getNodeSize)
      .attr("fill", this.getNodeColor)
      .call(dragDrop)
      .on('click', this.selectNode.bind(this))
      .on('mouseenter', this.highlightlink.bind(this))
      .on('mouseleave', this.unhighlightlink.bind(this))

    this.textElements = this.svg.append("g")
      .attr("class", "texts")
      .selectAll("text")
      .data(this.nodes)
      .enter().append("text")
      .text(function (node) { return node.label })
      .attr("font-size", function (node) { return node.type == 1 ? 12 : 9 })
      .attr("dx", 10)
      .attr("dy", function (node) { return node.type == 1 ? 2 : 10 })

    this.simulation.nodes(this.nodes).on('tick', () => {
      this.nodeElements
        .attr('cx', function (node) { return node.x })
        .attr('cy', function (node) { return node.y })
      this.textElements
        .attr('x', function (node) { return node.x })
        .attr('y', function (node) { return node.y })
      this.linkElements
        .attr('x1', function (link) { return link.source.x })
        .attr('y1', function (link) { return link.source.y })
        .attr('x2', function (link) { return link.target.x })
        .attr('y2', function (link) { return link.target.y })
      this.linkHighlightElements
        .attr('x1', function (link) { return link.source.x })
        .attr('y1', function (link) { return link.source.y })
        .attr('x2', function (link) { return link.target.x })
        .attr('y2', function (link) { return link.target.y })
      this.linkAlleleElements
        .attr('x1', function (link) { return link.source.x })
        .attr('y1', function (link) { return link.source.y })
        .attr('x2', function (link) { return link.target.x })
        .attr('y2', function (link) { return link.target.y })
      this.hightlight_overlay
        .attr('x1', function (link) { return link.source.x })
        .attr('y1', function (link) { return link.source.y })
        .attr('x2', function (link) { return link.target.x })
        .attr('y2', function (link) { return link.target.y })
    });
    this.simulation.force("link").links(this.links);
    this.simulation.force("link").links(this.allele_links);

  }
  selectNode(selectedNode) {

    this.addSelectedNode(selectedNode);
    // consoleconsoleconsole.log(this.selectedNodes);
    this.drawSelectNdoe();

  }
  drawSelectNdoe() {
    var nodes = this.selectedNodes;

    this.nodeElements.attr('fill', function (node) {
      if (nodes.has(node.id)) {

        if (node.type == 1)
          return node.group === 1 ? 'blue' : '#233e8b'
      }
      else {
        if (node.type == 1)
          return node.group === 1 ? '#233e8b' : '#233e8b'
        if (node.type == 2)
          return node.group === 1 ? '#CD113B' : '#CD113B'
        if (node.type == 0)
          return '#ffffff00'
      }

    });
    this.linkAlleleElements.attr('stroke-width', function (link) {
      return (nodes.has(link.target.id) || nodes.has(link.source.id)) ? '1' : '0'
    });
    //console.log('')
    this.getConnectionLink();
  }
  addSelectedNode(selectedNode) {
    if (!this.selectedNodes.has(selectedNode.id))
      this.selectedNodes.add(selectedNode.id);
    else {
      this.selectedNodes.delete(selectedNode.id);
    }

  }
  highlightlink(selectedNode) {
    this.hightlight_overlay.attr('stroke-width', function (link) {
      return link.target.id === selectedNode.id ? '1' : '0'
    })
  }

  unhighlightlink(selectedNode) {
    //this.svg.select(".hl_link").remove();
    this.hightlight_overlay.attr('stroke-width', function (link) {
      return '0'
    })

  }
  getNeighborNodes(node) {

    return this.links.reduce(function (neighbors, link) {
      if (link.target.id === node.id) {
        neighbors.push(link.source.id)
      } else if (link.source.id === node.id) {
        neighbors.push(link.target.id)
      }
      return neighbors
    },
      [node.id]
    );
  }

  isNeighborLink(node, link) {
    return link.target.id === node.id || link.source.id === node.id
  }


  getNodeColor(node, neighbors) {
    //if (Array.isArray(neighbors) && neighbors.indexOf(node.id) > -1) {
    //  return node.level === 1 ? '#233e8b' : 'green'
    //}
    if (node.type == 1)
      return node.group === 1 ? '#233e8b' : '#233e8b'
    if (node.type == 2)
      return node.group === 1 ? '#CD113B' : '#CD113B'
    if (node.type == 0)
      return '#ffffff00'
  }

  getNodeSize(node, neighbors) {

    if (node.type == 1)
      return node.group === 1 ? 10 : 8
    if (node.type == 2)
      return node.group === 1 ? 4 : 3
    else
      return 5;
  }
  getLinkColor(link) {
    if (link.type == 1) return '#233e8b77';
    else return '#CD113B'
  }
  getHighlightLinkColor(link) {
    if (link.type == 1) return 'blue';
    else return '#233e8b77'
  }
  getLinkStroke(link) {
    if (link.type == 1) return '12';
    else return '2'
  }
  getHighlightLinkStroke(link) {
    if (link.type == 1) return '3';
    else return '4'
  }
  getTextColor(node, neighbors) {
    return Array.isArray(neighbors) && neighbors.indexOf(node.id) > -1 ? 'green' : 'black'
  }
  zoomIn() {

    //console.log("event zoom in");
    if (this.zoom_lv < 3) this.zoom_lv = this.zoom_lv + 1;
    this.draw();

  }
  zoomOut() {
    // console.log("event zoom out");
    if (this.zoom_lv > 1) this.zoom_lv = this.zoom_lv - 1;
    this.draw();

  }
  getConnectionLink() {
    //find nearest common father node
    //get all successor nodes of each node
    var set_active_link = this.getActiveLink(this.selectedNodes);
    //find all gene node:
    var active_gene = new Set();
    // console.log(this.allele_links);
    for (var allele of this.allele_links) {
      if (this.selectedNodes.has(allele.target.id)) {
        active_gene.add(allele.source.id);
      }
    }


    var set_active_gene_link = this.getActiveLink(active_gene);
    //console.log(set_active_gene_link);
    for (let elem of set_active_gene_link) {
      set_active_link.add(elem);
    }
    this.linkHighlightElements.attr('stroke-width', function (link) {
      // console.log(link);
      if (set_active_link.has(link.source.id + "," + link.target.id)) {
        if (link.type == 1) return '3';
        else return '6'
      }
      else {
        return 0;
      }


    });


  }
  getActiveLink(activenodes) {
    var map = {};
    var max_p = 0;
    var max_id = 0;
    if (activenodes.size == 0)
      return new Set();
    //console.log(activenodes);
    for (let nid of activenodes) {

      let set_parent = new Set();
      var it_id = nid;

      while (this.reverseMapNodes.has(it_id)) {
        it_id = this.reverseMapNodes.get(it_id);
        set_parent.add(it_id);
      }
      if (max_p < set_parent.size) {
        max_p = set_parent.size;
        max_id = nid;
      }
      map[nid] = set_parent;
    }

    var largest_father_set = map[max_id];
    var nearest_father = undefined;
    for (let fid of largest_father_set) {
      var all_has = true;
      for (let nid of activenodes) {
        if (!map[nid].has(fid)) {
          all_has = false;
          break;
        }
      }
      if (all_has) {
        nearest_father = fid;
        break;
      }
    }


    var set_active_link = new Set();
    for (let nid of activenodes) {
      var pre = -1;
      for (let fid of map[nid]) {
        if (pre == -1) {
          set_active_link.add(nid + "," + nid + "_" + fid);
          set_active_link.add(nid + "_" + fid + "," + fid);


        }
        else {
          set_active_link.add(pre + "," + pre + "_" + fid);
          set_active_link.add(pre + "_" + fid + "," + fid);

          //console.log(pre);
        }
        pre = fid;
        if (fid == nearest_father)
          break;
      }
    }
    return set_active_link;
  }
  onChangeViewBranchLenght() {
    this.display_branch_length = document.getElementById("ch_length").checked;
    this.load(this.genelabel, this.phylotree, this.samples);
    this.draw();
  }


}
export default GeneFlowTree
