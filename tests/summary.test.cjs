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
load(path.join(root,'nikas-climate-entry-155.js'));
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
const raw=[[{entity_id:'sensor.t',state:'24',last_changed:'2026-09-07T00:00:00Z'},{state:'unavailable',last_changed:'2026-09-07T01:00:00Z'},{state:'',last_changed:'2026-09-07T02:00:00Z'},{state:'26',last_changed:'2026-09-07T03:00:00Z'}]];
const points=p.parseRoomHistory155(raw,'sensor.t');
assert.equal(points.length,4);assert.equal(points[1][1],null);assert.equal(points[2][1],null);
assert.equal(p.parseRoomHistory155(raw,'sensor.other').length,0);
const graph=p.drawRoomHistory155(points,Date.parse('2026-09-07T00:00:00Z'),Date.parse('2026-09-08T00:00:00Z'),'°C');
assert.equal((graph.match(/M[0-9]/g)||[]).length,2);
assert.match(p.drawRoomHistory155([],0,100,'°C'),/измерений нет/);
console.log('PASS: actual history response parsing, unavailable and empty values, separated graph segments');
