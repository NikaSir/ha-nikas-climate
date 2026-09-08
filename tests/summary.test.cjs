const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../custom_components/nikas_climate/frontend');
const classes=new Map();
const context=vm.createContext({console,Map,Set,Date,Number,String,Boolean,Math,Promise,
  HTMLElement:class {attachShadow(){this.shadowRoot={};}},
  localStorage:{getItem(){return null;},setItem(){}},
  customElements:{get:name=>classes.get(name),define:(name,type)=>classes.set(name,type)},
});
const seen=new Set();
function load(file){if(seen.has(file))return;seen.add(file);let source=fs.readFileSync(file,'utf8');source=source.replace(/^import "([^"?]+)(?:\?[^"\n]*)?";$/gm,(_,relative)=>{load(path.resolve(path.dirname(file),relative));return '';});vm.runInContext(`(()=>{${source}\n})();`,context,{filename:file});}
load(path.join(root,'nikas-climate-production.js'));
const Panel=classes.get('nikas-climate-panel');const p=new Panel();
p._entityRegistry=[];
p._hass={states:{'climate.living':{entity_id:'climate.living',state:'off',attributes:{friendly_name:'Кондиционер в зале',temperature:null,current_temperature:null,fan_mode:'auto',swing_mode:'off'}}}};
let m=p.roomModel({key:'living'});
assert.equal(m.target,null);assert.equal(m.indoor,null);
assert.equal(p.connection(m).label,'Нет данных','an unverified integration must not be called local');
p._entityRegistry=[{entity_id:'climate.living',platform:'syncleo'}];
assert.equal(p.connection(m).label,'Локально','available Syncleo identifies the local UDP path even when OFF');
assert.equal(p.connection(m).fresh,'Нет данных','default values provide no evidence of telemetry freshness');
assert.match(p.connection(m).tone,/freshness-unknown/);
assert.equal(p.peerConnectionTone160(m),'nodata','the peer lamp must not present untrusted freshness as healthy');
let html=p.summary(m);assert.match(html,/hero-off-v2.png/);assert.match(html,/Выключен/);assert.doesNotMatch(html,/Данные актуальны/);
assert.match(html,/Ночной<\/span><strong>—/);
assert.match(html,/Турбо<\/span><strong>—/);
assert.match(p.summary({...m,swing:'unknown'}),/Качание<\/span><strong>—/);
assert.match(p.summary({...m,swing:'vertical'}),/Качание<\/span><strong>Вкл\./);
assert.match(p.summary({...m,features:{night:'on',turbo:'off'}}),/Ночной<\/span><strong>Вкл\./);
assert.match(p.summary({...m,features:{night:'on',turbo:'off'}}),/Турбо<\/span><strong>Выкл\./);
assert.doesNotMatch(p.summary({...m,features:{turbo:'on'}}),/<span>Турбо<\/span><\/div><\/div>/);

function updateClimate(changes) {
  p._hass.states['climate.living']={...p._hass.states['climate.living'],...changes};
  return p.roomModel({key:'living'});
}
function assertUntrusted(model,label) {
  const connection=p.connection(model);
  assert.equal(connection.label,label);
  assert.equal(connection.fresh,'Нет данных','HA state alone must not invent current or previously accepted telemetry');
  assert.equal(p.peerConnectionTone160(model),label==='Нет связи'?'bad':'nodata');
  assert.doesNotMatch(connection.tone,/freshness-confirmed|freshness-pending|freshness-stale/);
}

assertUntrusted({...m,climate:null,available:false},'Нет данных');
for(const platform of [undefined,null,'unknown','unavailable','other']) {
  p._entityRegistry=[{entity_id:'climate.living',platform}];
  assertUntrusted(m,'Нет данных');
  assertUntrusted({...m,climate:{...m.climate,state:'unavailable'},available:false},'Нет данных');
}
p._entityRegistry=[{entity_id:'climate.living',platform:'syncleo'}];

// A received-looking HA snapshot and two optimistic command fields must have
// the same untrusted freshness. Both can exist without a proven RX timestamp.
for(const attributes of [
  {temperature:24,current_temperature:27,fan_mode:'auto'},
  {temperature:null,current_temperature:25,fan_mode:'high'},
  {temperature:24,current_temperature:null,fan_mode:'auto'},
]) {
  m=updateClimate({state:'off',attributes:{friendly_name:'Кондиционер в зале',swing_mode:'off',...attributes}});
  assertUntrusted(m,'Локально');
  for(const timestamp of ['2020-01-01T00:00:00Z',new Date().toISOString()]) {
    m=updateClimate({last_changed:timestamp,last_updated:timestamp,last_reported:timestamp});
    assertUntrusted(m,'Локально');
  }
}

// Unknown is missing knowledge, whereas Syncleo's explicit unavailable state
// is evidence of a lost transport. Preserved attributes do not prove a sample.
m=updateClimate({state:'unknown'});
assertUntrusted(m,'Нет данных');
for(const state of ['',null,undefined,'not-a-climate-mode']) {
  m=updateClimate({state});
  assertUntrusted(m,'Нет данных');
}
m=updateClimate({state:'unavailable'});
assertUntrusted(m,'Нет связи');
assert.match(p.summary(m),/Нет связи/);
for(const state of ['off','cool','heat']) {
  m=updateClimate({state});
  assertUntrusted(m,'Локально');
}
assert.doesNotMatch(p.summary(m),/Состояние получено|Ожидание данных|Данные актуальны|Данные устарели/);
// Returning to OFF after an outage must not carry fabricated stale/fresh memory.
m=updateClimate({state:'unavailable'});assertUntrusted(m,'Нет связи');
m=updateClimate({state:'off'});assertUntrusted(m,'Локально');
assert.equal(p.isHumidityEntity({entity_id:'sensor.battery',attributes:{device_class:'battery',unit_of_measurement:'%'}}),false);
assert.equal(p.isHumidityEntity({entity_id:'sensor.humidity',attributes:{device_class:'humidity',unit_of_measurement:'%'}}),true);
assert.match(p.statistics(m),/data-history-chart="temperature"/);
assert.match(p.statistics(m),/data-history-chart="humidity"/);
console.log('PASS: summary tri-state features, truthful Syncleo transport/freshness, humidity classification and statistics slots');
const raw=[[{entity_id:'sensor.t',state:'24',last_changed:'2026-09-07T00:00:00Z'},{state:'unavailable',last_changed:'2026-09-07T01:00:00Z'},{state:'',last_changed:'2026-09-07T02:00:00Z'},{state:'26',last_changed:'2026-09-07T03:00:00Z'}]];
const points=p.parseRoomHistory155(raw,'sensor.t');
assert.equal(points.length,4);assert.equal(points[1][1],null);assert.equal(points[2][1],null);
assert.equal(p.parseRoomHistory155(raw,'sensor.other').length,0);
const graph=p.drawRoomHistory155(points,Date.parse('2026-09-07T00:00:00Z'),Date.parse('2026-09-08T00:00:00Z'),'°C');
assert.equal((graph.match(/M[0-9]/g)||[]).length,2);
assert.match(p.drawRoomHistory155([],0,100,'°C'),/измерений нет/);
console.log('PASS: actual history response parsing, unavailable and empty values, separated graph segments');

for(const mode of ['heat','cool','auto','dry','fan_only']){
 const hero=p.hero156({...m,mode,available:true});
 assert.match(hero,new RegExp('hero-'+mode+'-v3.png'));
 assert.doesNotMatch(hero,/<svg|data-airflow/);
 assert(fs.existsSync(path.join(root,'assets','hero-'+mode+'-v3.png')));
}
assert.match(p.hero156({...m,mode:'off'}),/hero-off-v2.png/);
assert.match(p.hero156({...m,mode:'heat',available:false}),/hero-off-v2.png/);
console.log('PASS: distinct mode assets and closed unit when OFF/unavailable');
