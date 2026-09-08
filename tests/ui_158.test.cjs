const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'../custom_components/nikas_climate/frontend');
const classes=new Map();
const storage=new Map();
const pendingTimers=new Map();
let timerSequence=0;
const context=vm.createContext({
  console,Map,Set,Date,Number,String,Boolean,Math,Promise,Object,Intl,
  HTMLElement:class {attachShadow(){this.shadowRoot={};}},
  localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))},
  customElements:{get:name=>classes.get(name),define:(name,type)=>classes.set(name,type)},
  setTimeout:(callback,delay)=>{const id=++timerSequence;if(delay===1400)pendingTimers.set(id,callback);else Promise.resolve().then(callback);return id;},
  clearTimeout:id=>pendingTimers.delete(id),
  requestAnimationFrame:callback=>{callback();return 1;},
});
const seen=new Set();
function load(file){
  if(seen.has(file))return;
  seen.add(file);
  let source=fs.readFileSync(file,'utf8');
  source=source.replace(/^import "([^"?]+)(?:\?[^"\n]*)?";$/gm,(_,relative)=>{load(path.resolve(path.dirname(file),relative));return '';});
  vm.runInContext(`(()=>{${source}\n})();`,context,{filename:file});
}

load(path.join(root,'nikas-climate-production.js'));
const Panel=classes.get('nikas-climate-panel');
assert(Panel);

(async()=>{
  const p=new Panel();
  const viewport={clientWidth:430,clientHeight:720,scrollTop:120,scrollLeft:18,dataset:{}};
  const content={offsetWidth:430,scrollHeight:920,style:{}};
  p.shadowRoot={querySelector:selector=>selector==='.viewport'?viewport:selector==='.content'?content:null};
  p._selected='living';p._tab='summary';
  p._transform158={scale:1,x:0,y:0};
  p.setZoom158(1.5,{x:215,y:300});
  assert.equal(p._transform158.scale,1.5);
  assert.match(content.style.transform,/scale\(1\.5\)/);
  assert.equal(viewport.scrollTop,0);
  assert.equal(viewport.dataset.zoomed,'1');
  p.setZoom158(9,{x:215,y:300});
  assert.equal(p._transform158.scale,2,'upper zoom bound is 200%');
  p.setZoom158(0.1,{x:215,y:300});
  assert.equal(p._transform158.scale,0.75,'lower zoom bound is 75%');
  viewport.scrollTop=30;viewport.scrollLeft=20;
  p.resetZoom158({announce:false});
  assert.equal(JSON.stringify(p._transform158),JSON.stringify({scale:1,x:0,y:0}));
  assert.equal(viewport.scrollTop,0);assert.equal(viewport.scrollLeft,0);
  assert.equal(content.style.transform,'');
  assert.deepEqual(JSON.parse(storage.get(p.__viewKey158())),{scale:1,x:0,y:0});

  p.patch=()=>{};
  p.roomModel=()=>({
    climate:{entity_id:'climate.living'},
    roomTempEntity:'sensor.room_temperature',
    humidityEntity:'sensor.room_humidity',
    featureEntities:{night:'switch.night'},
  });
  p._history={living:{room:[]}};
  const calls=[];
  p._hass={callService:async(domain,service,data)=>calls.push({domain,service,data})};
  await p.refreshSelected();
  assert.equal(p._refreshState158,'ok');
  assert.equal(calls.length,1);
  assert.equal(calls[0].service,'update_entity');
  assert(!Panel.prototype.refreshSelected.toString().includes('reload_config_entry'));
  const oldResultTimer=[...pendingTimers.values()][0];

  p._hass={callService:async()=>{throw Error('poll failed');}};
  await p.refreshSelected();
  assert.equal(p._refreshState158,'error');
  assert.match(p._refreshMessage158,/poll failed/);
  oldResultTimer();
  assert.equal(p._refreshState158,'error','stale success timer must not erase a newer failure');
  const currentTimer=[...pendingTimers.values()][0];
  currentTimer();
  assert.equal(p._refreshState158,null);
  console.log('PASS: transform zoom 75–200%, full reset and truthful isolated refresh result');
})().catch(error=>{console.error(error);process.exitCode=1;});
