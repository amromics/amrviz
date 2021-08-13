<style>
select {
  border: 1px solid rgb(170, 170, 170);
  border-radius: 3px;
  padding: 4px;
  background-color: transparent;
}
.download-link {
  text-decoration: underline;
  color: blue;
  float: right;
  cursor: pointer;
}
.channel {
  background-color: gray;
  color: white;
  font-size: 11px;
  min-width: 20px;
  height: 20px;
  border-radius: 5px;
  padding: 3px;
  margin-right: 5px;
  float: left;
}
.closeChannel {
  margin-left: 5px;
  cursor: pointer;
}
.closeChannel:hover {
  color: black;
}
</style>
<template>
  <div>
    <a id="btn_save" style="display:block;float:right;margin-top:-40px;" v-on:click="saveImage">
      <i class="ti-camera"></i>
    </a>
    <div style="padding-bottom:10px;min-height:35px;border-bottom:1px solid #aaa;">
      <select
        style="display:block;float:left"
        v-if="list_type"
        name="type"
        id="type"
        v-model="selected_data"
        v-on:change="onChangeData"
      >
        <option v-for="item  in list_type" :key="item.name" :value="item.type">{{item.name}}</option>
      </select>
      <a
        id="btn_addchannel"
        style="display:block;float:left;font-size:25px; margin-left:5px;"
        v-on:click="addToChannel"
      >
        <i class="ti-plus"></i>
      </a>
      <div
        style="display:block;float:left; padding-top:5px; margin-left:10px;"
        id="channel_panel"
      >
        <div v-for="channel in selectedChannels" :key="channel.name" class="channel">
          <span>{{channel.name}}</span>
           <span class="closeChannel" v-on:click="removeFromChannel(channel.name)"><i class="ti-close"></i></span>
        </div>
      </div>
      <a v-on:click="downloadCSV" id="download_link" class="download-link">Download CSV</a>
    </div>

    <div id="heatmap" style="clear:both;width:100%"></div>
  </div>
</template>
<script>
/* eslint-disable */
import { PhyloHeatmap } from "@/amromicsjs";
import EventBus from "@/event-bus.js";
import SampleAPI from "@/api/SampleAPI";
// import SampleIGV from "@/components/Visualization/IGV";
export default {
  name: "Heatmap",
  props: ["newitck_tree", "heatmap_url"],
  data() {
    return {
      loading: false,
      list_type: [],
      hits: [],

      heatmapview: undefined,
      selected_data: "amr",
      tree_data: undefined,
      heatmap: undefined,
      selectedChannels:[]
    };
  },
  async mounted() {
    this.loading = true;
    const value = await SampleAPI.fetchHeatmap(this.collectionId);
    this.heatmap = value.data;
    this.list_type = [];
    console.log(this.heatmap);
    for (var channel of this.heatmap.channels) {
      this.list_type.push({ type: channel.name, name: channel.name });
    }

    this.selected_data = this.list_type[0].name;
    this.selectedChannels = [this.heatmap.channels[0]];
   
    var ctx = document.getElementById("heatmap");
    //console.log(this.core_data);
    //console.log(Phylogeny);
    this.heatmapview = new PhyloHeatmap(ctx);
    this.tree_data = this.newitck_tree.replace(/.ref/g, "");
    this.tree_data = this.tree_data.replace(/_contigs.fasta/g, "");

    this.heatmapview.load(this.tree_data, this.selectedChannels);
    //this.heatmapview.setOptions({width:900,height:400});
    this.heatmapview.draw();
   
    EventBus.$on("samples_emited", arr_ids => {
      // console.log('sample_emited '+arr_ids);
      this.heatmapview.setActiveNames(arr_ids);
    });
    //export csv  file

    this.loading = false;
  },
  async created() {},
  computed: {
    collectionId() {
      return this.$route.params.cid;
    }
  },
  methods: {
   /*  loadListChannel() {
      document.getElementById("channel_panel").innerHTML = "";
      for (var i = 0; i < this.selectedChannels.length; i++) {
        var channel_html = document.createElement("div");
        channel_html.setAttribute("class", "channel");
        var channel_name = document.createElement("span");
        channel_name.innerText = this.selectedChannels[i].name;
        var channel_close = document.createElement("span");
        channel_close.setAttribute("class", "closeChannel");
        channel_close.innerHTML = '<i class="ti-close"></i>';
        channel_html.appendChild(channel_name);
        channel_html.appendChild(channel_close);
        channel_close.setAttribute(
          "data-channel",
          this.selectedChannels[i].name
        );
        //channel_close.addEventListener("click", this.removeFromChannel(this.selectedChannels[i].name));
        document.getElementById("channel_panel").appendChild(channel_html);
      }
    }, */
    onChangeData: function(event) {
      //get currrent contigs
    },
    addToChannel() {
      for (var channel of this.heatmap.channels) {
        if (
          channel.name == this.selected_data &&
          !this.selectedChannels.includes(channel)
        ) {
          this.selectedChannels.push(channel);
        }
      }
      
      this.heatmapview.load(this.tree_data, this.selectedChannels);

      this.heatmapview.draw();
      //this.loadListChannel();
    },
    removeFromChannel(name) {
     
    
      for (var i = 0; i < this.selectedChannels.length; i++) {
        if (this.selectedChannels[i].name == name) {
          this.selectedChannels.splice(i, 1);
        }
      }
     
      this.heatmapview.load(this.tree_data, this.selectedChannels);

      this.heatmapview.draw();
      
    },
    downloadCSV() {
      var data_to_export=[];
      for (var channel of this.selectedChannels) {
       
          data_to_export=data_to_export.concat(channel.hit);
        
      }

      var rows = [];

      var map_sample = new Map();
      var map_gene = new Map();
      var map = new Map();
      //console.log(data_to_export);
      for (var i = 0; i < data_to_export.length; i++) {
        if (!map_sample.has(data_to_export[i].sample)) {
          map_sample.set(data_to_export[i].sample, map_sample.size);
        }
        if (!map_gene.has(data_to_export[i].gene)) {
          map_gene.set(data_to_export[i].gene, map_gene.size);
        }
        map.set(
          map_sample.get(data_to_export[i].sample) +
            "-" +
            map_gene.get(data_to_export[i].gene),
          data_to_export[i].identity
        );
      }
      //console.log(map);
      var str = '"sample",';
      for (const [key, value] of map_gene) {
        str += '"' + key + '",';
      }
      str = str.substring(0, str.length - 1) + "\n";

      for (const [key, value] of map_sample) {
        var r_str = '"' + key + '",';
        for (const [key_g, value_g] of map_gene) {
          //console.log(value+"-"+value_g);
          if (map.has(value + "-" + value_g))
            r_str += '"' + map.get(value + "-" + value_g) + '",';
          else r_str += '"",';
        }
        r_str = r_str.substring(0, r_str.length - 1) + "\n";
        str += r_str;
      }
      var hiddenElement = document.createElement("a");
      hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(str);
      hiddenElement.target = "_blank";
      hiddenElement.download = this.selected_data + ".csv";
      hiddenElement.click();
      //console.log(rows);
    },
    saveImage: function(event) {
      var svg_tree = document.getElementById("ph_treeview").firstElementChild;
      var svg_heatmap = document.getElementById("ph_heatmapview")
        .firstElementChild;
      var svg = document.createElement("svg");
      svg.setAttribute(
        "width",
        svg_tree.getAttribute("width") + svg_heatmap.getAttribute("width")
      );
      svg.setAttribute("height", svg_heatmap.getAttribute("height"));
      var g_tree = svg_tree.childNodes[0].cloneNode(true);
      var g_treename = svg_tree.childNodes[1].cloneNode(true);
      var g_heatmap = svg_heatmap.firstChild.cloneNode(true);
      g_heatmap.setAttribute(
        "transform",
        "translate(" + svg_tree.getAttribute("width") + ",30)"
      );
      svg.appendChild(g_tree);
      svg.appendChild(g_treename);
      svg.appendChild(g_heatmap);
      var container = document.createElement("div");
      container.appendChild(svg);
      var svg_str = container.innerHTML;
      svg_str = svg_str.replace(
        "<svg",
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
      var blob = new Blob([svg_str], { type: "text/plain;charset=utf-8" });
      saveAs(blob, "Heatmap.svg");
    }
  }
};
</script>
