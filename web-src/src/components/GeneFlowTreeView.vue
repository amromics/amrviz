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
.center {
  position: fixed;
  left: 50%;
  top: 50%;
}

</style>
<template>
  <div>
   <a id="btn_save" style="float:right;margin-top:-40px;"  v-on:click="saveImage"><i class="ti-camera"></i></a>
    <div id="gftreeview" style="width:100%"></div>
  </div>
</template>
<script>
/* eslint-disable */
import { GeneFlowTree } from "@/amromicsjs";
import EventBus from "@/event-bus.js";
import SampleAPI from "@/api/SampleAPI";
import { saveAs } from 'file-saver';
export default {
  name: "GeneFlowTreeView",
  props: ["species_tree","alignmentData"],
  data() {
    return {
      loading: false,
      list_alignments: [],
      current_alignment: undefined,
      genflowtree:undefined
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
        this.reloadAlignment(gene_id);

        this.loading = false;
      });
      EventBus.$on("samples_emited", arr_ids => {
        //console.log('sample_emited '+arr_ids);
        this.loading = true;

        //this.alignmentview.setActiveNames(arr_ids);
        this.genflowtree.setActiveNames(arr_ids);
        this.loading = false;
      });
  },
  async created() {},
  methods: {
    async getAlignment(){
        return await SampleAPI.fetchAlignment(
        this.collectionId,
        this.alignmentData.alignments[3].gene
      );

    },
     async loadAlignment(res) {
       const pako = require('pako');
      var value=JSON.parse(pako.ungzip(res.data,{ to: 'string' }));

      var ctx = document.getElementById("gftreeview");

      this.current_alignment = value;
      //console.log(this.current_alignment);
      this.genflowtree = new GeneFlowTree(ctx);

      var gene_tree_data = atob(this.alignmentData.alignments[0].tree).replace(
        /.ref/g,
        ""
      );
      gene_tree_data = gene_tree_data.replace(/.fasta/g, "");
      //console.log(this.alignmentData.alignments[0])
      this.genflowtree.load(
        this.alignmentData.alignments[0].gene,
        this.species_tree,
        gene_tree_data
       
      );
      //alignmentview.setOptions({width:ctx.clientWidth,height:0});

      this.genflowtree.draw();


      this.loading = false;
    },
    async reloadAlignment(gene_id) {
     // console.log( this.list_alignments);
      for (var i = 0; i < this.list_alignments.length; i++) {
        
        if (this.list_alignments[i].gene == gene_id.replace("-","")) {
         
          var tree = atob(this.alignmentData.alignments[i].tree).replace(
            /.ref/g,
            ""
          );
          tree = tree.replace(/.fasta/g, "");
          // console.log(this.list_alignments[i].gene);
          // const value = await SampleAPI.fetchAlignment(
          //   this.collectionId,
          //   this.list_alignments[i].gene
          // );
          // const pako = require('pako');
          // this.current_alignment=JSON.parse(pako.ungzip(value.data,{ to: 'string' }));

         this.genflowtree.load(
            this.alignmentData.alignments[i].gene,
            this.species_tree,
            tree
       
         );
          this.genflowtree.draw();
          break;
        }
      }
    },
     saveImage: function(event){
        var svg=document.getElementById("amr_gf_treeview").innerHTML;
        svg=svg.replace("<svg","<svg xmlns=\"http://www.w3.org/2000/svg\"");
        var blob = new Blob([svg], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "GeneTreeView.svg");
    }
   
  }
};
</script>
