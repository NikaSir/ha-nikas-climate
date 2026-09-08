const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('fs');
const path=require('path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../custom_components/nikas_climate/frontend');

const touch=(type,points)=>{const event=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(event,'touches',{value:points.map(([clientX,clientY])=>({clientX,clientY}))});return event;};

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE || undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-zygote','--single-process']});
 const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await page.route('http://panel.test/**',route=>{
  const pathname=new URL(route.request().url()).pathname;
  if(pathname==='/')return route.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>html,body{margin:0;height:100%;--primary-text-color:#111;--secondary-text-color:#666;--primary-color:#03a9d9;--success-color:#43a047;--error-color:#e53935;--card-background-color:white;--primary-background-color:#f7f8fa;--secondary-background-color:#eee;--disabled-text-color:#aaa;--divider-color:#ddd}</style><script type="module" src="/nikas_climate_panel/nikas-climate-production.js"></script>'});
  const file=path.join(root,pathname.replace('/nikas_climate_panel/',''));
  return fs.existsSync(file)?route.fulfill({path:file}):route.fulfill({status:404,body:''});
 });
 await page.goto('http://panel.test/');
 await page.waitForFunction(()=>customElements.get('nikas-climate-panel'));
 await page.evaluate(()=>{
  const p=document.createElement('nikas-climate-panel');document.body.append(p);window.p=p;
  const registry=[
   {entity_id:'climate.living',config_entry_id:'syncleo-1',device_id:'ac-1',platform:'syncleo'},
   {entity_id:'switch.living_night',device_id:'ac-1',unique_id:'living_night'},
   {entity_id:'switch.living_turbo',device_id:'ac-1',unique_id:'living_turbo'},
  ];
  p._entityRegistry=registry;p._areaRegistry=[];p._labelRegistry=[];
  p.ensureRegistries=async()=>{};p.ensureHistory=async()=>{};
  window.calls=[];
  const states={
   'climate.living':{entity_id:'climate.living',state:'off',attributes:{friendly_name:'Кондиционер в зале',temperature:24,current_temperature:27,fan_mode:'auto',swing_mode:'off'}},
   'sensor.sensor_th_zb_11_temperature':{entity_id:'sensor.sensor_th_zb_11_temperature',state:'24.9',attributes:{device_class:'temperature'}},
   'sensor.sensor_th_zb_11_humidity':{entity_id:'sensor.sensor_th_zb_11_humidity',state:'39',attributes:{device_class:'humidity'}},
   'switch.living_night':{entity_id:'switch.living_night',state:'off',attributes:{}},
   'switch.living_turbo':{entity_id:'switch.living_turbo',state:'off',attributes:{}},
  };
  window.makeHass=(callService=async(domain,service,data)=>window.calls.push({domain,service,data}))=>({states,callService,callWS:async()=>[],callApi:async()=>[],locale:{language:'ru'},config:{time_zone:'UTC'}});
  p.hass=window.makeHass();
 });
 await page.waitForTimeout(180);

 const results=[];
 for (const [width,height,top,bottom] of [[390,844,59,34],[430,932,59,34],[360,800,24,24],[320,568,20,0]]) {
  await page.setViewportSize({width,height});
  await page.evaluate(({top,bottom})=>{
   const root=p.shadowRoot;
   root.querySelector('.shell').style.gridTemplateRows=`${60+top}px 52px minmax(0,1fr) ${64+bottom}px`;
  },{top,bottom});
  // HA defines icons asynchronously; missing icons made earlier tests too short.
  await page.evaluate(()=>{
   if(!customElements.get('ha-icon')) customElements.define('ha-icon',class extends HTMLElement {
    connectedCallback(){this.style.display='inline-block';this.style.width='var(--mdc-icon-size,24px)';this.style.height='var(--mdc-icon-size,24px)';}
   });
  });
  await page.waitForTimeout(160);
  const row=await page.evaluate(()=>{
   const r=p.shadowRoot,v=r.querySelector('.viewport'),card=r.querySelector('.u154-summary'),photo=r.querySelector('.u154-photo-wrap'),plaque=r.querySelector('.u154-connection .connection-indicator'),content=r.querySelector('.content');
   const plaqueRect=plaque.getBoundingClientRect();
   return {width:innerWidth,height:innerHeight,bottom:card.getBoundingClientRect().bottom,limit:v.getBoundingClientRect().bottom,photo:photo.offsetHeight,plaqueWidth:plaqueRect.width,plaqueHeight:plaqueRect.height,viewportWidth:v.clientWidth,contentWidth:content.scrollWidth};
  });
  const expectedPlaqueWidth=width<=340?160:168;
  assert(Math.abs(row.plaqueWidth-expectedPlaqueWidth)<=0.5,JSON.stringify(row));
  assert(Math.abs(row.plaqueHeight-58)<=0.5,JSON.stringify(row));
  assert(row.contentWidth<=row.viewportWidth,`horizontal overflow: ${JSON.stringify(row)}`);
  if(width>=390)assert(row.bottom<=row.limit-10,JSON.stringify(row));
  results.push(row);
 }
 console.log('PASS summary with HA icon sizes and iPhone safe areas',results);
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
