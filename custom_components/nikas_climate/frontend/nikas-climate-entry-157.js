import "./nikas-climate-entry-156.js?v=1.4.16";

const Panel=customElements.get("nikas-climate-panel");
const UI157="1.4.17";
const ZOOM_KEY157="nikas_climate.zoom";
const PEERS157=[
 {key:"living",title:"Зал",area:"11.2 · Гостиная",climateNames:["Кондиционер в зале","Кондей в Гостиной"],explicitRoomTempEntity:"sensor.sensor_th_zb_11_temperature",explicitHumidityEntity:"sensor.sensor_th_zb_11_humidity"},
 {key:"veranda",title:"Веранда",area:"14 · Веранда",climateNames:["Кондиционер на веранде","Кондей на Веранде"],explicitRoomTempEntity:"sensor.sensor_th_zb_14_temperature",explicitHumidityEntity:"sensor.sensor_th_zb_14_humidity"}
];
const clamp157=(value,min,max)=>Math.max(min,Math.min(max,value));
const distance157=(touches)=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
const center157=(touches)=>({x:(touches[0].clientX+touches[1].clientX)/2,y:(touches[0].clientY+touches[1].clientY)/2});

if(Panel&&!Panel.prototype.__ui157){
 Panel.prototype.setZoom157=function(value,focus=null){
  const viewport=this.shadowRoot?.querySelector(".viewport");
  const content=this.shadowRoot?.querySelector(".content");
  if(!viewport||!content)return;
  const before=this._zoom157||1;
  const next=Math.round(clamp157(Number(value)||1,1,1.75)*100)/100;
  const point=focus||{x:viewport.clientWidth/2,y:viewport.clientHeight/2};
  const localX=(viewport.scrollLeft+point.x)/before;
  const localY=(viewport.scrollTop+point.y)/before;
  this._zoom157=next;
  content.style.zoom=String(next);
  viewport.dataset.zoomed=next>1?"1":"0";
  localStorage.setItem(ZOOM_KEY157,String(next));
  requestAnimationFrame(()=>{
   viewport.scrollLeft=Math.max(0,localX*next-point.x);
   viewport.scrollTop=Math.max(0,localY*next-point.y);
  });
 };

 Panel.prototype.__installZoom157=function(){
  const viewport=this.shadowRoot?.querySelector(".viewport");
  if(!viewport||viewport.dataset.zoom157==="1")return;
  viewport.dataset.zoom157="1";
  let stored=Number(localStorage.getItem(ZOOM_KEY157));
  if(!Number.isFinite(stored))stored=1;
  this._zoom157=clamp157(stored,1,1.75);
  this.setZoom157(this._zoom157);
  let gesture=null,lastTwoFingerTap=0;
  viewport.addEventListener("touchstart",event=>{
   if(event.touches.length===2){
    event.preventDefault();event.stopImmediatePropagation();
    gesture={distance:distance157(event.touches),zoom:this._zoom157||1,center:center157(event.touches),started:Date.now(),moved:false};
   }else if((this._zoom157||1)>1){event.stopImmediatePropagation();}
  },{capture:true,passive:false});
  viewport.addEventListener("touchmove",event=>{
   if(event.touches.length===2&&gesture){
    event.preventDefault();event.stopImmediatePropagation();
    const ratio=distance157(event.touches)/Math.max(1,gesture.distance);
    if(Math.abs(ratio-1)>.025)gesture.moved=true;
    this.setZoom157(gesture.zoom*ratio,center157(event.touches));
   }else if((this._zoom157||1)>1){event.stopImmediatePropagation();}
  },{capture:true,passive:false});
  viewport.addEventListener("touchend",event=>{
   if(!gesture)return;
   event.stopImmediatePropagation();
   if(event.touches.length<2){
    const tap=!gesture.moved&&Date.now()-gesture.started<280;
    if(tap&&Date.now()-lastTwoFingerTap<420){this.setZoom157(1);lastTwoFingerTap=0;}
    else if(tap)lastTwoFingerTap=Date.now();
    gesture=null;
   }
  },{capture:true,passive:false});
  viewport.addEventListener("touchcancel",()=>{gesture=null;},{capture:true});
  viewport.addEventListener("gesturestart",event=>event.preventDefault(),{passive:false});
  viewport.addEventListener("gesturechange",event=>event.preventDefault(),{passive:false});
 };

 Panel.prototype.refreshSelected=async function(){
  if(this._refreshing||!this._hass)return;
  const started=Date.now();this._refreshing=true;this._refreshState157="working";this._refreshMessage157="Обновление…";this.patch();
  let accepted=false,error=null;
  try{
   const room=PEERS157.find(item=>item.key===this._selected)||PEERS157[0];
   const model=this.roomModel(room);const registry=this.registryEntry(model.climate?.entity_id);
   const entities=[model.climate?.entity_id,model.roomTempEntity,model.humidityEntity,...Object.values(model.featureEntities||{})].filter(Boolean);
   if(entities.length){
    try{await this._hass.callService("homeassistant","update_entity",{entity_id:[...new Set(entities)]});accepted=true;}
    catch(reason){error=reason;}
   }
   if(registry?.config_entry_id){
    try{await this._hass.callService("homeassistant","reload_config_entry",{entry_id:registry.config_entry_id});accepted=true;}
    catch(reason){error=reason;}
   }
   if(!entities.length&&!registry?.config_entry_id)throw new Error("У выбранного кондиционера не найдены сущности для обновления");
   if(!entities.length&&!registry?.config_entry_id)throw Error("Сущность выбранного кондиционера не найдена");
   this._entityRegistry=null;this._areaRegistry=null;this._labelRegistry=null;
   if(this._history)delete this._history[room.key];
   try{await this.ensureRegistries(true);}catch(reason){error=error||reason;}
   const remaining=900-(Date.now()-started);if(remaining>0)await new Promise(resolve=>setTimeout(resolve,remaining));
   try{await this.ensureHistory(this.roomModel(room),true);}catch(reason){error=error||reason;}
   if(!accepted&&!error)throw new Error("Сущности выбранного кондиционера не найдены");
   if(!accepted&&error)throw error;
   this._refreshState157="ok";this._refreshMessage157="Запрос выполнен";
  }catch(reason){this._refreshState157="error";this._refreshMessage157=`Не удалось обновить: ${reason?.message||reason}`;}
  finally{
   this._refreshing=false;this.patch();
   clearTimeout(this.__refreshTimer157);
   this.__refreshTimer157=setTimeout(()=>{this._refreshState157=null;this._refreshMessage157=null;this.patch();},1400);
  }
 };

 const fix=function(){
  const root=this.shadowRoot;if(!root)return;
  let style=root.querySelector("style[data-ui157]");
  if(!style){
   style=document.createElement("style");style.dataset.ui157="1";style.textContent=`
    .viewport{scroll-padding-bottom:28px}
    .content{padding-bottom:calc(34px + env(safe-area-inset-bottom))!important;transform-origin:top left}
    .viewport[data-zoomed="1"]{overflow-x:auto!important;touch-action:pan-x pan-y!important}
    .header-action#refresh{transition:transform .12s ease,color .18s ease,background .18s ease}
    .header-action#refresh:active{transform:scale(.90)}
    .header-action#refresh.refreshing ha-icon{animation:spin .75s linear infinite!important}
    .header-action#refresh.refresh-ok{color:var(--success-color,#43a047);background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color))}
    .header-action#refresh.refresh-error{color:var(--error-color,#db4437);background:color-mix(in srgb,var(--error-color,#db4437) 10%,var(--card-background-color))}
   `;
  }
  if(root.lastElementChild!==style)root.append(style);
  const version=root.querySelector(".header-title span");if(version)version.textContent=`UI v${UI157}`;
  const refresh=root.getElementById("refresh");
  if(refresh){
   const state=this._refreshState157;
   refresh.classList.toggle("refresh-ok",state==="ok");refresh.classList.toggle("refresh-error",state==="error");
   refresh.setAttribute("aria-busy",state==="working"?"true":"false");
   refresh.setAttribute("aria-label",this._refreshMessage157||"Обновить состояние кондиционера");
   refresh.title=this._refreshMessage157||"Обновить";
   const icon=refresh.querySelector("ha-icon");if(icon)icon.setAttribute("icon",state==="ok"?"mdi:check":state==="error"?"mdi:alert-circle-outline":"mdi:refresh");
  }
  this.__installZoom157();
  const viewport=root.querySelector(".viewport"),card=root.querySelector(".u154-summary"),photo=root.querySelector(".u154-photo-wrap");
  if(viewport&&card&&photo&&(this._zoom157||1)===1){
   const chrome=card.offsetHeight-photo.offsetHeight;
   photo.style.height=`${Math.max(80,Math.min(252,viewport.clientHeight-42-chrome))}px`;
  }
 };
 for(const name of ["render","patch"]){const previous=Panel.prototype[name];Panel.prototype[name]=function(...args){const result=previous.apply(this,args);fix.call(this);return result;};}
 Panel.prototype.__ui157=true;
}
