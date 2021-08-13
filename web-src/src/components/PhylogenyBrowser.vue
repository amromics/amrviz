<style scoped>
</style>
<template>
<div>
  <a id="btn_download_tree" style="display:block;float:right;margin-top:-40px;" v-on:click="saveTree">
      <i class="ti-download"></i>
    </a>
<div id="treeview">
</div>
</div>
</template>
<script>
/* eslint-disable */
import {Phylogeny} from "@/amromicsjs";
import EventBus from '@/event-bus.js';

import { saveAs } from 'file-saver';
// import SampleIGV from "@/components/Visualization/IGV";
export default {
    name: 'PhylogenyBrowser',
    props: ['newitck_tree','samples'],
    data() {
        return {
            loading: false,
          
        };
    },
    mounted() {
      this.loading = true;
      var ctx=document.getElementById('treeview');
      //console.log(this.core_data);
      //console.log(Phylogeny);
      var tree = new Phylogeny(ctx);
      var tree_data=this.newitck_tree.replace(/.ref/g,"");  
      tree_data=tree_data.replace(/_contigs.fasta/g,'');      
      var metadata={};
     
      for (var i =0 ;i<this.samples.length;i++){
        //console.log(this.samples[i].metadata);
        
        metadata[this.samples[i].id]=this.samples[i].metadata;
      }
      // console.log(metadata);
      tree.load(tree_data,metadata);
      
      tree.draw();
      tree.tree.on('updated', ({
        property,
        nodeIds
      }) => {
        if (property === 'selected') {
          var arr_ids=[];
          for (var i=0;i<nodeIds.length;i++){
            arr_ids.push(nodeIds[i].replace(/\'/g,''));
          }
          //console.log(arr_ids);
          EventBus.$emit('samples_emited',arr_ids);
        }
      });
      ctx.addEventListener("meta_select", function(event) {
       // console.log(event.detail);
        EventBus.$emit('samples_emited', event.detail);
      });
      this.loading = false;
      
    },
    async created() {

      
    },
    methods: {
       saveTree: function(event){
          var blob = new Blob([this.newitck_tree], { type: "text/plain;charset=utf-8" });
          saveAs(blob, "Phylogeny.tree");
      }
    }
};
</script>
