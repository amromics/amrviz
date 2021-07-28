<style>
select{
  border: 1px solid rgb(170, 170, 170);
  border-radius: 3px;
  padding: 4px;
  background-color: transparent;
}
.download-link{
  text-decoration: underline;
  color:blue;
  float:right;
  cursor: pointer;
}
</style>
<template>
<div>
<div style="padding-bottom:10px;border-bottom:1px solid #aaa;">
  <select v-if="list_type"  name="type" id="type" v-model="selected_data" v-on:change="onChangeData">
    <option v-for="item  in list_type" :key="item.name" :value="item.type">{{item.name}}</option>
  </select>
  <a v-on:click="downloadCSV" id="download_link" class="download-link">Download CSV</a>
</div>
<div id="heatmap" style="width:100%">
</div>
</div>

</template>
<script>
/* eslint-disable */
import {PhyloHeatmap} from "@/amromicsjs";
import EventBus from '@/event-bus.js';
import SampleAPI from "@/api/SampleAPI";
// import SampleIGV from "@/components/Visualization/IGV";
export default {
  name: 'Heatmap',
  props: ['newitck_tree','heatmap_url'],
  data() {
    return {
      loading: false,
      list_type:[],
      list_amr_hits:[],
      list_vir_hits:[],
      list_amr_class:[],
      list_vir_class:[],
      
      heatmapview:undefined,
      selected_data:"amr",
      tree_data:undefined,
      heatmap:undefined
    };
  },
  async mounted() {
    this.loading = true;
    const value = await SampleAPI.fetchHeatmap(this.collectionId);
    this.heatmap=value.data
    this.list_type=[{type:'amr',name:"AMR genes"},{type:'vir',name:"Virulome genes"}];
    this.selected_data="amr";
    for (var i = 0; i<this.heatmap.hits.length;i++){
      if(this.heatmap.hits[i].type=="amr"){
        this.list_amr_hits.push(this.heatmap.hits[i]);
        if(!this.list_amr_class.includes(this.heatmap.hits[i].class)){
          this.list_amr_class.push(this.heatmap.hits[i].class);
        }
       
      }
      if(this.heatmap.hits[i].type=="vir"){
        this.list_vir_hits.push(this.heatmap.hits[i]);
        
      }
    }
    
    
    var ctx=document.getElementById('heatmap');
    //console.log(this.core_data);
    //console.log(Phylogeny);
    this.heatmapview = new PhyloHeatmap(ctx);
    this.tree_data=this.newitck_tree.replace(/.ref/g,"");  
    this.tree_data=this.tree_data.replace(/_contigs.fasta/g,'');  
    //console.log(this.list_amr_hits);
    //console.log(this.list_amr_class);
    this.heatmapview.load(this.tree_data,this.list_amr_hits);
    //this.heatmapview.setOptions({width:900,height:400});
    this.heatmapview.draw();
    EventBus.$on('samples_emited', arr_ids => {
      console.log('sample_emited '+arr_ids);
      this.heatmapview.setActiveNames(arr_ids);
      
    });
    //export csv  file
    
    
    this.loading = false;
  },
  async created() {
    

  },
   computed: {
    collectionId() {
      return this.$route.params.cid;
      ;
    }
  },
  methods: {
    onChangeData:function(event) {
              //get currrent contigs
              console.log(this.selected_data);
              if (this.selected_data=="amr")
                this.heatmapview.load(this.tree_data,this.list_amr_hits);
              if (this.selected_data=="vir")
                  this.heatmapview.load(this.tree_data,this.list_vir_hits);
              this.heatmapview.draw();
          },
    downloadCSV(){
       var data_to_export;
        if (this.selected_data=="amr"){
           data_to_export=this.list_amr_hits;
           
        }
               
        if (this.selected_data=="vir")
               data_to_export=this.list_vir_hits;
        var rows=[];
       
        var map_sample=new Map();
        var map_gene=new Map();
        var map=new Map();
        console.log(data_to_export);
        for (var i=0;i<data_to_export.length;i++){
            if(!map_sample.has(data_to_export[i].sample)){
              map_sample.set(data_to_export[i].sample,map_sample.size);
            }
            if(!map_gene.has(data_to_export[i].gene)){
              map_gene.set(data_to_export[i].gene,map_gene.size);
            }
            map.set(map_sample.get(data_to_export[i].sample)+"-"+map_gene.get(data_to_export[i].gene),data_to_export[i].identity);

        }
        console.log(map);
        var str='"sample",';
        for(const[key,value] of map_gene){
         
          str+='"'+key+'",';
        }
        str=str.substring(0, str.length - 1)+'\n';
        
        for(const[key,value] of map_sample){
         
          var r_str='"'+key+'",';
          for(const[key_g,value_g] of map_gene){
            //console.log(value+"-"+value_g);
            if(map.has(value+"-"+value_g))
            
              r_str+='"'+map.get(value+"-"+value_g)+'",';
            else
              r_str+='"",';      
          }
          r_str=r_str.substring(0, r_str.length - 1)+'\n';
           str+=r_str;
        }
        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(str);
        hiddenElement.target = '_blank';
        hiddenElement.download = this.selected_data+'.csv';
        hiddenElement.click();
        console.log(rows);
       
        
    }
  }
};
</script>
