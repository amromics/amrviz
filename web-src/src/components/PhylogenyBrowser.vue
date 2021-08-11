<style scoped>
</style>
<template>
<div>

<div id="treeview">
</div>
</div>
</template>
<script>
/* eslint-disable */
import {Phylogeny} from "@/amromicsjs";
import EventBus from '@/event-bus.js';
import html2canvas from 'html2canvas';
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
       saveImage: function(event){
         //console.log("download phylo");
      html2canvas(document.getElementById("treeview")).then(function (canvas){
          canvas.toBlob(function(blob) {
        saveAs(blob, "Phylogeny.png"); 
          document.body.appendChild(canvas);
        }
        );
      }
      );
    }
    }
};
</script>
