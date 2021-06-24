<template>
  <div class="card">
    <div class="card-image" v-if="$slots.image">
      <slot name="image"></slot>
    </div>
    <div class="card-header" v-if="$slots.header || title">
      <slot name="header">
        <h4 class="card-title">{{title}}</h4>
        <p class="card-category" v-if="subTitle">{{subTitle}}</p>
      </slot>
      <!-- <div style="float:right;cursor:pointer" v-on:click="isHidden = !isHidden"><i v-if="!isHidden" class="ti-angle-up"></i><i v-if="isHidden" class="ti-angle-down"></i></div> -->
    </div>
    <div  class="card-body" v-if="$slots.default&&!isHidden">
      <slot></slot>
    </div>
    <slot name="raw-content" v-if="!isHidden"></slot>
    <div class="card-footer" v-if="$slots.footer">
      <hr>
      <slot name="footer"></slot>
    </div>
  </div>
</template>
<script>
export default {
  name: "card",
  props: {
    title: String,
    subTitle: String
  },
  data(){
    return{
       isHidden:false
    }
   
  }
};
</script>
<style>
</style>
