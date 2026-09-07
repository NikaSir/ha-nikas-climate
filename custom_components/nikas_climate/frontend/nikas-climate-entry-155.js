import "./nikas-climate-entry-154.js?v=1.4.14";
import "./nikas-climate-history-155.js?v=1.4.15";
const Panel=customElements.get("nikas-climate-panel");
if(Panel&&!Panel.prototype.__ui155){
 const previousControl=Panel.prototype.control;
 Panel.prototype.control=function(m){
  let html=previousControl.call(this,m);
  const start=html.indexOf('<div class="u136-control-head">'),end=html.indexOf('<div class="u136-setrow">');
  if(start<0||end<0)return html;
  const mode=m.available?m.mode:"off";
  const file=({off:"hero-off-v2.png",cool:"hero-cool.webp",heat:"hero-heat.webp",dry:"hero-dry.webp",auto:"hero-auto.webp",fan_only:"hero-fan.webp"})[mode]||"hero-off-v2.png";
  html=html.slice(0,start)+`<div class="u155-control-top"><div><span>Температура помещения</span><strong>${this.fmt(m.roomTemp,1)}°</strong><small>Комнатный датчик</small></div><img src="/nikas_climate_panel/assets/${file}" alt="Ballu Lagoon"></div>`+html.slice(end);
  return html.replace('<span>Створка</span>','<span>Качание</span>').replace('Зафиксирована</small>','Выкл.</small>');
 };
 const fix=function(){
  const root=this.shadowRoot;if(!root)return;
  if(!root.querySelector('style[data-ui155]')){
   const style=document.createElement('style');style.dataset.ui155='1';style.textContent=`
    .viewport.summary-fit{overflow-y:auto!important}
    .content.summary-fit-content,.content.summary-fit-content>#content{height:auto!important;min-height:100%!important;overflow:visible!important}
    .content:has(.u136-control),.content:has(.u136-control)>#content{height:auto!important;min-height:0!important;overflow:visible!important}
    .u136-control{height:auto!important;min-height:0!important;overflow:visible!important;gap:8px!important;padding:14px!important}
    .u136-control>*{flex-shrink:0!important}
    .u155-control-top{display:grid;grid-template-columns:minmax(0,1fr) 110px;align-items:center;gap:12px;margin-bottom:4px}
    .u155-control-top>div{display:flex;flex-direction:column;gap:3px}.u155-control-top span{font-size:12px;font-weight:700;color:var(--secondary-text-color)}.u155-control-top strong{font-size:34px;line-height:1.1}.u155-control-top small{font-size:11px;color:var(--secondary-text-color)}.u155-control-top img{width:110px;height:80px;object-fit:cover;border-radius:16px}
    .u136-control .u136-setrow{height:76px!important;grid-template-columns:minmax(0,1fr) 100px!important;margin-bottom:4px!important}
    .u136-control .u136-set,.u136-control .u136-flap{height:76px!important;min-height:76px!important}
    .u136-control .u136-set{grid-template-columns:48px minmax(0,1fr) 48px!important}.u136-control .u136-set strong{font-size:36px!important;line-height:1.05!important}
    .u136-control .u136-flap small{font-size:11px!important}.u136-control .u136-flap span{font-size:12px!important}
    .u136-control .u136-title{margin:2px 0 0!important;font-size:12px!important;line-height:16px!important}
    .u136-control .u136-grid.modes .u136-action{height:62px!important;min-height:62px!important}
    .u136-control .u136-grid.fans .u136-action{height:58px!important;min-height:58px!important}
    .u136-control .u136-feature{height:54px!important;min-height:54px!important}
    .u136-control .u136-bottom{margin-top:8px!important}.u136-control .u136-bottom .legend{margin-bottom:8px!important}
    .history155{margin:14px 0;padding:12px;border:1px solid var(--divider-color);border-radius:18px}.history155 h3{font-size:15px;margin:0 0 6px}.history155 svg{display:block;width:100%;height:auto;overflow:visible}.history155 text{font:11px Arial;fill:var(--secondary-text-color)}.history155 p{font-size:12px;color:var(--secondary-text-color);overflow-wrap:anywhere}.history155 button{padding:10px;border:1px solid var(--divider-color);border-radius:12px;background:var(--card-background-color);color:var(--primary-color)}
   `;root.append(style);
  }
  const override=root.querySelector('style[data-ui155]');if(root.lastElementChild!==override)root.append(override);
  const version=root.querySelector('.header-title span');if(version)version.textContent='UI v1.4.15';
 };
 for(const name of ['render','patch']){const previous=Panel.prototype[name];Panel.prototype[name]=function(...args){const r=previous.apply(this,args);fix.call(this);return r;};}
 Panel.prototype.__ui155=true;
}
