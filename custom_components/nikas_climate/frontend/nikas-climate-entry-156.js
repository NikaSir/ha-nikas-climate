import "./nikas-climate-entry-155.js?v=1.4.15";
const Panel=customElements.get('nikas-climate-panel');
const HERO156={heat:'Обогрев',cool:'Охлаждение',dry:'Осушение',auto:'Авто',fan_only:'Вентиляция'};
if(Panel&&!Panel.prototype.__ui156){
 Panel.prototype.hero156=function(m){
  const mode=m?.available===false?'unavailable':m?.mode;
  const active=Object.hasOwn(HERO156,mode);
  const file=active?`hero-${mode}-v3.png`:'hero-off-v2.png';
  // Illustration of selected mode, not compressor-action telemetry.
  return `<img class="u156-hero" src="/nikas_climate_panel/assets/${file}?v=1.4.16" alt="${active?HERO156[mode]:'Кондиционер без потока'}">`;
 };
 const summary=Panel.prototype.summary,control=Panel.prototype.control;
 Panel.prototype.summary=function(m){return summary.call(this,m).replace(/<img class="u154-photo"[^>]*\/>/,this.hero156(m,'summary'));};
 Panel.prototype.control=function(m){return control.call(this,m).replace(/<img src="\/nikas_climate_panel\/assets\/[^\"]+" alt="Ballu Lagoon">/,this.hero156(m,'control'));};
 const fix=function(){const root=this.shadowRoot;if(!root)return;
  let style=root.querySelector('style[data-ui156]');if(!style){style=document.createElement('style');style.dataset.ui156='1';style.textContent=`
   .u156-hero{display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit}
   .u155-control-top>.u156-hero{width:110px;height:80px;border-radius:16px}
   .u136-control .u136-feature,.u136-control .u136-feature ha-icon,.u136-control .u136-feature strong,.u136-control .u136-feature small{color:var(--primary-text-color,#111)!important}
   .u154-band-secondary .u154-status.active ha-icon,.u154-band-secondary .u154-status.active strong{color:var(--primary-text-color,#111)!important}
  `;}if(root.lastElementChild!==style)root.append(style);
  const v=root.querySelector('.header-title span');if(v)v.textContent='UI v1.4.16';
 };
 for(const name of ['render','patch']){const previous=Panel.prototype[name];Panel.prototype[name]=function(...args){const r=previous.apply(this,args);fix.call(this);return r;};}
 Panel.prototype.__ui156=true;
}
