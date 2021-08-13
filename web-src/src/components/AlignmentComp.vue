<style>
.loader {
  border: 5px solid #f3f3f3; /* Light grey */
  border-top: 5px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 2s linear infinite;
  display: inline-block;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.miniloader{
  border: 7px solid #f3f3f3; /* Light grey */
  border-top: 7px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 2s linear infinite;
  display: inline-block;
}

</style>
<template>
  <div>
    <a id="btn_save" style="float:right;margin-top:-40px;" v-on:click="saveImage"><i class="ti-camera"></i></a>
    <div id="aligmentview" style="width:100%"></div> 
  </div>
</template>
<script>
/* eslint-disable */
import { AlignmentViewer } from "@/amromicsjs";
import EventBus from "@/event-bus.js";
import SampleAPI from "@/api/SampleAPI";
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
// import SampleIGV from "@/components/Visualization/IGV";
export default {
  name: "AlignmentComp",
  props: ["alignmentData"],
  data() {
    return {
      loading: false,
      list_alignments: [],
      current_alignment: undefined,
      alignmentview: undefined
    };
  },
  computed: {
    collectionId() {
      return this.$route.params.cid;
    }
  },
 async mounted() {
    this.loading = true;
      
      //console.log(this.core_data);
      //console.log(Phylogeny);

      this.list_alignments = this.alignmentData.alignments;
      var value=await this.getAlignment();
      //console.log(value);
      await this.loadAlignment(value);
   //this.loadAlignment();
      EventBus.$on("gene_id_emited", gene_id => {
        //console.log('gene_id_emited'+gene_id);
        this.loading = true;
       // console.log(this.loading);
        this.reloadAlignment(gene_id);

        this.loading = false;
      });
      EventBus.$on("samples_emited", arr_ids => {
       // console.log('sample_emited '+arr_ids);
        this.loading = true;

        this.alignmentview.setActiveNames(arr_ids);
        this.loading = false;
      });
  },
  async created() {},
  methods: {
    async getAlignment(){
        return await SampleAPI.fetchAlignment(
        this.collectionId,
        this.alignmentData.alignments[0].gene
      );
         
    },
     async loadAlignment(res) {
       const pako = require('pako');
      var value=JSON.parse(pako.ungzip(res.data,{ to: 'string' }));
         
      var ctx = document.getElementById("aligmentview");
      
      this.current_alignment = value;
      //console.log(this.current_alignment);
      this.alignmentview = new AlignmentViewer(ctx);

      var tree_data = atob(this.alignmentData.alignments[0].tree).replace(
        /.ref/g,
        ""
      );
      tree_data = tree_data.replace(/.fasta/g, "");
      //console.log(this.alignmentData.alignments[0])
      this.alignmentview.load(
        this.alignmentData.alignments[0].gene,
        tree_data,
        this.current_alignment,
        undefined
      );
      //alignmentview.setOptions({width:ctx.clientWidth,height:0});

      this.alignmentview.draw();

      
      this.loading = false;
    },
    async reloadAlignment(gene_id) {
      for (var i = 0; i < this.list_alignments.length; i++) {
        if (this.list_alignments[i].gene == gene_id.replace("-","")) {
          var tree = atob(this.alignmentData.alignments[i].tree).replace(
            /.ref/g,
            ""
          );
          tree = tree.replace(/.fasta/g, "");
          //console.log(tree);
          const value = await SampleAPI.fetchAlignment(
            this.collectionId,
            this.list_alignments[i].gene
          );
          const pako = require('pako');
          this.current_alignment=JSON.parse(pako.ungzip(value.data,{ to: 'string' }));
          
          this.alignmentview.load(
            this.alignmentData.alignments[i].gene,
            tree,
            this.current_alignment
          );
          this.alignmentview.draw();
          break;
        }
      }
    },
    saveImage: function(event){
        var svg_tree=document.getElementById("al_treeview").firstElementChild;
        var svg_alignment=document.getElementById("al_alignment").firstElementChild;
        var svg=document.createElement("svg");
        svg.setAttribute("width",svg_tree.getAttribute("width")+svg_alignment.getAttribute("width"));
        svg.setAttribute("height",svg_tree.getAttribute("height"));
        var g_tree=svg_tree.childNodes[0].cloneNode(true);
        var g_treename=svg_tree.childNodes[1].cloneNode(true);
        var g_alignment=svg_alignment.firstChild.cloneNode(true);
        g_alignment.setAttribute("transform","translate("+svg_tree.getAttribute("width")+",30)");
        svg.appendChild(g_tree);
        svg.appendChild(g_treename);
        svg.appendChild(g_alignment);
        var container=document.createElement("div");
        container.appendChild(svg);
        var svg_str=container.innerHTML;
        svg_str=svg_str.replace("<svg","<svg xmlns=\"http://www.w3.org/2000/svg\"");
        var blob = new Blob([svg_str], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "Alignment.svg");
    }
  }
};
</script>
