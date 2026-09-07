const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../custom_components/nikas_climate/frontend');
const classes=new Map();
const context=vm.createContext({console,Map,Set,Date,Number,String,Boolean,Math,Promise,
  HTMLElement:class {attachShadow(){this.shadowRoot={};}},
  localStorage:{getItem(){return null;}},
  customElements:{get:name=>classes.get(name),define:(name,type)=>classes.set(name,type)},
});
const seen=new Set();
function load(file){if(seen.has(file))return;seen.add(file);let source=fs.readFileSync(file,'utf8');source=source.replace(/^import "([^"?]+)(?:\?[^"\n]*)?";$/gm,(_,relative)=>{load(path.resolve(path.dirname(file),relative));return '';});vm.runInContext(`(()=>{${source}\n})();`,context,{filename:file});}
load(path.join(root,'nikas-climate-entry-154.js'));
const Panel=classes.get('nikas-climate-panel');const p=new Panel();
p._entityRegistry=[];
p._hass={states:{'climate.living':{entity_id:'climate.living',state:'off',attributes:{friendly_name:'Кондиционер в зале',temperature:null,current_temperature:null,fan_mode:'auto',swing_mode:'off'}}}};
let m=p.roomModel({key:'living'});
assert.equal(m.target,null);assert.equal(m.indoor,null);
assert.equal(p.connection(m).tone,'local');
let html=p.summary(m);assert.match(html,/hero-off-v2.png/);assert.match(html,/Выключен/);assert.doesNotMatch(html,/Данные актуальны/);
assert.match(html,/Ночной<\/span><strong>—/);
assert.match(html,/Турбо<\/span><strong>—/);
assert.match(p.summary({...m,swing:'unknown'}),/Качание<\/span><strong>—/);
assert.match(p.summary({...m,swing:'vertical'}),/Качание<\/span><strong>Вкл\./);
assert.doesNotMatch(p.summary({...m,features:{turbo:'on'}}),/<span>Турбо<\/span><\/div><\/div>/);
assert.match(p.summary({...m,available:false,mode:'unavailable'}),/Нет связи/);
assert.equal(p.isHumidityEntity({entity_id:'sensor.battery',attributes:{device_class:'battery',unit_of_measurement:'%'}}),false);
assert.equal(p.isHumidityEntity({entity_id:'sensor.humidity',attributes:{device_class:'humidity',unit_of_measurement:'%'}}),true);
assert.match(p.statistics(m),/data-history-chart="temperature"/);
assert.match(p.statistics(m),/data-history-chart="humidity"/);
console.log('PASS: summary missing data, OFF, swing, connection, humidity classification and statistics slots');
(async()=>{
  const configs=[];
  context.window={loadCardHelpers:async()=>({createCardElement:config=>{configs.push(config);return {};}})};
  const slots={temperature:{isConnected:true,replaceChildren(card){this.card=card;}},humidity:{isConnected:true,replaceChildren(card){this.card=card;}}};
  p.shadowRoot={querySelectorAll:()=>[],querySelector:selector=>slots[selector.includes('temperature')?'temperature':'humidity']};
  p._tab='statistics';
  p._selected='living';
  for(const [id,type] of [['sensor.sensor_th_zb_11_temperature','temperature'],['sensor.sensor_th_zb_11_humidity','humidity']])p._hass.states[id]={entity_id:id,state:'22',attributes:{device_class:type}};
  await p.mountStatistics154();
  assert.equal(configs.length,2);
  assert.equal(configs[0].entities[0].entity,'sensor.sensor_th_zb_11_temperature');
  assert.equal(configs[1].entities[0].entity,'sensor.sensor_th_zb_11_humidity');
  assert.equal(configs[0].hours_to_show,24);
  p._statisticsHours=168;await p.mountStatistics154();
  assert.equal(configs.at(-1).hours_to_show,168);
  assert.equal(slots.humidity.card.hass,p._hass);
  p._selected='veranda';await p.mountStatistics154();
  assert.equal(slots.humidity.textContent,'Влажность: датчик не выбран');
  console.log('PASS: native HA history card sources, periods, hass binding, missing sensor');
})().catch(error=>{console.error(error);process.exitCode=1;});
