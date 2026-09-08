// NIKAS_CONNECTION_DECORATION_CONTRACT v1.1: production bundle/assets, mocked HA data/icons.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../custom_components/nikas_climate/frontend');
// HA frontend src/resources/roboto.ts supplies these faces globally. Loading the
// real roboto-fontface@0.10.0 files reproduces the host; production CSS is unchanged.
const haFontRoot=process.env.HA_FONT_ROOT || path.join(path.dirname(require.resolve('roboto-fontface/package.json')),'fonts/roboto');
const haFontFaces=[['Regular',400],['Medium',500],['Bold',700]];
for(const [face]of haFontFaces)assert(fs.existsSync(path.join(haFontRoot,`Roboto-${face}.woff2`)),`HA Roboto-${face}.woff2 fixture dependency missing`);
const haFontCSS=haFontFaces.map(([face,weight])=>`@font-face{font-family:Roboto;font-style:normal;font-weight:${weight};font-display:swap;src:local('${face==='Regular'?'Roboto':`Roboto ${face}`}'),local('Roboto-${face}'),url('/ha-fonts/Roboto-${face}.woff2') format('woff2')}`).join('');
const shots=process.env.NIKAS_SCREENSHOT_DIR;
const close=(a,b,label,tolerance=.1)=>assert(Math.abs(a-b)<=tolerance,`${label}: ${a} != ${b}`);
const font=value=>value.replace(/["'\s]/g,'').toLowerCase();
const sharedFont=font('-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE || undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-zygote','--single-process']});
 try {
  const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.route('http://panel.test/**',route=>{
   const pathname=new URL(route.request().url()).pathname;
   if(pathname==='/')return route.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1"><style>'+haFontCSS+'html,body{margin:0;height:100%;--primary-text-color:#111;--secondary-text-color:#666;--primary-color:#03a9d9;--success-color:#43a047;--warning-color:#f6a623;--error-color:#e53935;--card-background-color:white;--primary-background-color:#f7f8fa;--secondary-background-color:#eee;--disabled-text-color:#aaa;--divider-color:#ddd}</style><script type="module" src="/nikas_climate_panel/nikas-climate-production.js"></script>'});
   if(pathname.startsWith('/ha-fonts/'))return route.fulfill({path:path.join(haFontRoot,path.basename(pathname)),contentType:'font/woff2'});
   const file=path.join(root,pathname.replace('/nikas_climate_panel/',''));
   return fs.existsSync(file)?route.fulfill({path:file}):route.fulfill({status:404,body:''});
  });
  await page.goto('http://panel.test/');await page.waitForFunction(()=>customElements.get('nikas-climate-panel'));
  await page.evaluate(()=>{
   window.p=document.createElement('nikas-climate-panel');document.body.append(p);
   p._entityRegistry=['living','veranda'].flatMap((key,index)=>[
    {entity_id:`climate.${key}`,config_entry_id:'syncleo-1',device_id:`ac-${index}`,platform:'syncleo'},
    ...['night','turbo'].map(f=>({entity_id:`switch.${key}_${f}`,device_id:`ac-${index}`,unique_id:`${key}_${f}`}))
   ]);
   p._areaRegistry=[];p._labelRegistry=[];p.ensureRegistries=async()=>{};p.ensureHistory=async()=>{};
   window.calls=[];window.states={};
   for(const [key,name,id] of [['living','Кондиционер в зале','11'],['veranda','Кондиционер на веранде','14']]){
    states[`climate.${key}`]={entity_id:`climate.${key}`,state:'off',attributes:{friendly_name:name,temperature:24,current_temperature:27,fan_mode:'auto',swing_mode:'off'}};
    for(const [metric,value] of [['temperature','24.9'],['humidity','39']])states[`sensor.sensor_th_zb_${id}_${metric}`]={entity_id:`sensor.sensor_th_zb_${id}_${metric}`,state:value,attributes:{device_class:metric}};
    for(const f of ['night','turbo'])states[`switch.${key}_${f}`]={entity_id:`switch.${key}_${f}`,state:'off',attributes:{}};
   }
   window.makeHass=(callService=async(domain,service,data)=>calls.push({domain,service,data}))=>({states,callService,callWS:async()=>[],callApi:async()=>[],locale:{language:'ru'},config:{time_zone:'UTC'}});
   p.hass=makeHass();window.originalConnection=p.connection;window.fixtureConnection=null;
   p.connection=function(model){return fixtureConnection || originalConnection.call(this,model);};
   window.keepNodes=()=>{window.savedNodes=['.shell','.app-header','.bottom-nav','.u154-summary','.connection-indicator','.u154-decoration','.u154-corner'].map(s=>[s,p.shadowRoot.querySelector(s)]);};
   window.nodesStable=()=>savedNodes.every(([s,n])=>n&&n.isConnected&&p.shadowRoot.querySelector(s)===n);
   window.geometry=()=>{
    const r=p.shadowRoot,card=r.querySelector('.u154-summary'),plaque=card.querySelector(':scope > .connection-indicator');
    const decoration=card.querySelector(':scope > .u154-decoration'),circle=decoration.querySelector('.u154-corner');
    const hero=card.querySelector(':scope > .u154-hero'),heading=hero.querySelector('.u154-head'),photo=hero.querySelector('.u154-photo-wrap');
    const lamp=plaque.querySelector('.connection-lamp'),copy=plaque.querySelector('.connection-copy'),main=copy.querySelector('strong'),fresh=copy.querySelector('small');
    const scale=p._transform158?.scale||1,c=card.getBoundingClientRect();
    const rect=n=>{const b=n.getBoundingClientRect();return {left:(b.left-c.left)/scale,top:(b.top-c.top)/scale,right:(b.right-c.left)/scale,bottom:(b.bottom-c.top)/scale,width:b.width/scale,height:b.height/scale};};
    const css=(n,keys)=>Object.fromEntries(keys.map(k=>[k,getComputedStyle(n)[k]]));
    const rangeRects=n=>{const range=document.createRange();range.selectNodeContents(n);return [...range.getClientRects()].map(b=>({left:(b.left-c.left)/scale,right:(b.right-c.left)/scale,top:(b.top-c.top)/scale,bottom:(b.bottom-c.top)/scale}));};
    const typography=['fontFamily','fontSize','fontWeight','lineHeight','marginTop','marginRight','marginBottom','marginLeft','paddingTop','paddingRight','paddingBottom','paddingLeft','letterSpacing','fontStyle','textTransform','whiteSpace','textOverflow'];
    return {
     scale,viewport:{width:innerWidth,height:innerHeight},hostWidth:p.getBoundingClientRect().width,card:rect(card),absoluteCard:{top:c.top,bottom:c.bottom},
     plaque:rect(plaque),decoration:rect(decoration),circle:rect(circle),lamp:rect(lamp),copy:rect(copy),main:rect(main),fresh:rect(fresh),heading:rect(heading),photo:rect(photo),
     cardCSS:css(card,['position','isolation','boxSizing','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','paddingTop','paddingRight','paddingBottom','paddingLeft','borderRadius','overflow']),
     plaqueCSS:css(plaque,['position','top','right','boxSizing','width','minWidth','maxWidth','height','minHeight','maxHeight','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','borderTopWidth','borderRadius','display','gridTemplateColumns','columnGap','alignItems','zIndex','boxShadow','transitionDuration','animationName']),
     decorationCSS:css(decoration,['position','top','right','bottom','left','borderRadius','overflow','zIndex','pointerEvents','opacity']),
     circleCSS:css(circle,['position','top','right','width','height','borderRadius','backgroundColor','opacity','borderTopWidth','boxShadow','filter','transform','animationName']),
     lampCSS:css(lamp,['width','height','borderRadius','boxShadow']),copyCSS:css(copy,['display','flexDirection','rowGap','textAlign']),mainCSS:css(main,typography),freshCSS:css(fresh,typography),
     headingCSS:css(heading,['paddingTop','paddingRight','minHeight']),heroZ:getComputedStyle(hero).zIndex,
     label:main.textContent,freshness:fresh.textContent,palette:{main:getComputedStyle(main).color,fresh:getComputedStyle(fresh).color,lamp:getComputedStyle(lamp).backgroundColor,background:getComputedStyle(plaque).backgroundColor,border:getComputedStyle(plaque).borderTopColor},
     peerPalette:[...r.querySelectorAll('.peer[data-room]')].map(peer=>({room:peer.dataset.room,tone:peer.querySelector('.peer-lamp').className,lamp:getComputedStyle(peer.querySelector('.peer-lamp')).backgroundColor})),
     shellRects:['.app-header','.peer-selector','.bottom-nav'].map(s=>{const b=r.querySelector(s).getBoundingClientRect();return {left:b.left,top:b.top,width:b.width,height:b.height};}),
     textRects:[...rangeRects(main),...rangeRects(fresh)],titleRects:rangeRects(heading.querySelector('.u154-mode')),
     decorativeOnly:decoration.getAttribute('aria-hidden')==='true'&&!decoration.querySelector('button,a,[tabindex]'),
     accessiblePlaque:!plaque.closest('[aria-hidden="true"]')&&plaque.getAttribute('role')==='status',
     horizontalOverflow:Math.max(0,r.querySelector('.content').scrollWidth-r.querySelector('.viewport').clientWidth),
     viewBottom:r.querySelector('.viewport').getBoundingClientRect().bottom,
     imageLoaded:photo.querySelector('img').complete&&photo.querySelector('img').naturalWidth>0,ui:r.querySelector('.header-title span').textContent,
    };
   };
  });
  // Actual HA icon box dimensions must participate before fitting the image.
  await page.evaluate(()=>customElements.define('ha-icon',class extends HTMLElement {connectedCallback(){this.style.display='inline-block';this.style.width='var(--mdc-icon-size,24px)';this.style.height='var(--mdc-icon-size,24px)';}}));
  await page.evaluate(async()=>{await Promise.all([400,500,600,700].map(w=>document.fonts.load(`${w} 13px Roboto`,'Данные актуальны')));await document.fonts.ready;});
  const settle=()=>page.waitForTimeout(180);await settle();
  const cdp=await context.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
  const {root:documentNode}=await cdp.send('DOM.getDocument',{depth:-1,pierce:true});
  const findPanel=node=>node.localName==='nikas-climate-panel'?node:(node.children||[]).map(findPanel).find(Boolean);
  const panelNode=findPanel(documentNode),platformFonts={};
  for(const [name,selector]of [['main','.connection-copy strong'],['freshness','.connection-copy small']]){
   const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:panelNode.shadowRoots[0].nodeId,selector});
   platformFonts[name]=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;
   assert(platformFonts[name].length&&platformFonts[name].every(f=>f.familyName.startsWith('Roboto')),`HA host font should render ${name}: ${JSON.stringify(platformFonts[name])}`);
  }
  const evidence=[];
  const measure=async name=>{
   const g=await page.evaluate(()=>geometry());
   const expect=(obj,want)=>{for(const [key,value]of Object.entries(want))assert.equal(obj[key],value,`${name}: ${key}`);};
   close(g.plaque.width,168,`${name}: plaque width`);close(g.plaque.height,58,`${name}: plaque height`);close(g.plaque.top,14,`${name}: plaque top`);close(g.card.width-g.plaque.right,14,`${name}: plaque right`);
   close(g.circle.width,205,`${name}: circle width`);close(g.circle.height,205,`${name}: circle height`);close(g.circle.top,-91,`${name}: circle top`);close(g.circle.right-g.card.width,69,`${name}: circle right`);
   expect(g.cardCSS,{position:'relative',isolation:'isolate',boxSizing:'border-box',borderTopWidth:'1px',borderRightWidth:'1px',borderBottomWidth:'1px',borderLeftWidth:'1px',paddingTop:'16px',paddingRight:'16px',paddingBottom:'16px',paddingLeft:'16px'});
   assert.notEqual(g.cardCSS.overflow,'hidden',`${name}: only decoration clips`);
   expect(g.plaqueCSS,{position:'absolute',top:'13px',right:'13px',boxSizing:'border-box',width:'168px',minWidth:'168px',maxWidth:'168px',height:'58px',minHeight:'58px',maxHeight:'58px',paddingTop:'11px',paddingRight:'12px',paddingBottom:'11px',paddingLeft:'12px',marginTop:'0px',marginRight:'0px',marginBottom:'0px',marginLeft:'0px',borderTopWidth:'1px',borderRadius:'18px',display:'grid',gridTemplateColumns:'10px 123px',columnGap:'9px',alignItems:'center',zIndex:'2',boxShadow:'rgba(0, 0, 0, 0.055) 0px 4px 14px 0px',transitionDuration:'0s',animationName:'none'});
   expect(g.decorationCSS,{position:'absolute',top:'0px',right:'0px',bottom:'0px',left:'0px',borderRadius:g.cardCSS.borderRadius,overflow:'hidden',zIndex:'0',pointerEvents:'none',opacity:'1'});
   close(g.decoration.left,1,`${name}: decoration inset`);close(g.decoration.top,1,`${name}: decoration inset`);close(g.decoration.width,g.card.width-2,`${name}: decoration width`);
   expect(g.circleCSS,{position:'absolute',top:'-92px',right:'-70px',width:'205px',height:'205px',borderRadius:'50%',backgroundColor:'rgba(3, 169, 217, 0.07)',opacity:'1',borderTopWidth:'0px',boxShadow:'none',filter:'none',transform:'none',animationName:'none'});
   expect(g.lampCSS,{width:'10px',height:'10px',borderRadius:'50%',boxShadow:'none'});close(g.lamp.width,10,`${name}: lamp width`);close(g.lamp.height,10,`${name}: lamp height`);
   expect(g.copyCSS,{display:'flex',flexDirection:'column',rowGap:'3px',textAlign:'left'});close(g.copy.height,34,`${name}: text stack height`);close(g.copy.width,123,`${name}: text column width`);
   for(const [css,size,weight,line]of [[g.mainCSS,'16px','700','17px'],[g.freshCSS,'13px','600','14px']]){
    assert.equal(font(css.fontFamily),sharedFont,`${name}: font stack`);
    expect(css,{fontSize:size,fontWeight:weight,lineHeight:line,marginTop:'0px',marginRight:'0px',marginBottom:'0px',marginLeft:'0px',paddingTop:'0px',paddingRight:'0px',paddingBottom:'0px',paddingLeft:'0px',fontStyle:'normal',textTransform:'none',whiteSpace:'nowrap',textOverflow:'clip'});
    assert(['normal','0px'].includes(css.letterSpacing),`${name}: zero letter spacing`);
   }
   assert(g.decorativeOnly&&g.accessiblePlaque,`${name}: accessible state and decorative-only circle`);assert.equal(g.heroZ,'1',`${name}: content layer`);
   const textOverflow=g.textRects.some(text=>text.left<g.copy.left-.1||text.right>g.copy.right+.1);
   if(textOverflow&&shots){fs.mkdirSync(shots,{recursive:true});fs.writeFileSync(path.join(shots,'text-overflow.json'),JSON.stringify({name,...g},null,2));await page.screenshot({path:path.join(shots,'text-overflow.png')});}
   for(const text of g.textRects)assert(text.left>=g.copy.left-.1&&text.right<=g.copy.right+.1,`${name}: full label does not fit ${JSON.stringify({text,copy:g.copy})}`);
   for(const text of g.titleRects){
    const overlap=text.left<g.plaque.right-.1&&text.right>g.plaque.left+.1&&text.top<g.plaque.bottom-.1&&text.bottom>g.plaque.top+.1;
    assert(!overlap,`${name}: title overlaps plaque ${JSON.stringify({text,plaque:g.plaque})}`);assert(text.bottom<=g.photo.top+.1,`${name}: title overlays image`);
   }
   close(g.photo.top-g.heading.bottom,12,`${name}: heading/image gap`);assert(g.heading.height>=58,`${name}: minimum heading height`);
   expect(g.headingCSS,{paddingRight:g.card.width<360?'0px':'177px',paddingTop:g.card.width<360?'67px':'0px'});
   if(g.scale===1)assert.equal(g.horizontalOverflow,0,`${name}: horizontal overflow`);
   evidence.push({name,ui:g.ui,viewport:g.viewport,hostWidth:g.hostWidth,card:g.card,scale:g.scale,plaque:g.plaque,circle:g.circle,label:g.label,freshness:g.freshness,textWidths:g.textRects.map(r=>r.right-r.left),palette:g.palette,computed:{plaque:g.plaqueCSS,circle:g.circleCSS,main:g.mainCSS,fresh:g.freshCSS}});
   return g;
  };
  const setHost=async(width,height,top=0,bottom=0,sidebar=0)=>{
   await page.setViewportSize({width,height});
   await page.evaluate(({top,bottom,sidebar})=>{p.resetZoom158({announce:false});p.style.display='block';p.style.width=`calc(100% - ${sidebar}px)`;p.style.marginLeft=`${sidebar}px`;const r=p.shadowRoot;r.querySelector('.shell').style.gridTemplateRows=`${60+top}px 52px minmax(0,1fr) ${64+bottom}px`;r.querySelector('.u154-summary').style.removeProperty('width');r.querySelector('.viewport').scrollTop=0;},{top,bottom,sidebar});await settle();
  };
  for(const [width,height,top,bottom]of [[390,844,59,34],[430,932,59,34],[360,800,24,24],[320,568,20,0],[932,430,0,20],[768,1024,24,20],[1280,900,0,0]]){
   for(const sidebar of width>=768?[0,256]:[0]){
    await setHost(width,height,top,bottom,sidebar);const g=await measure(`viewport-${width}x${height}-sidebar-${sidebar}`);
    if([390,430].includes(width)){assert(g.absoluteCard.bottom<=g.viewBottom-10,`primary summary must fit before bottom menu: ${JSON.stringify(g)}`);assert(g.imageLoaded,'production hero image loaded');if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,`summary-${width}.png`)});}}
   }
  }
  await setHost(430,932,59,34);
  for(const width of [359,360,361]){await page.evaluate(w=>p.shadowRoot.querySelector('.u154-summary').style.width=`${w}px`,width);await settle();const g=await measure(`card-${width}`);close(g.card.width,width,'card fixture width');}
  await setHost(430,932,59,34);await page.evaluate(()=>keepNodes());const reference=await measure('stable-reference');
  const unchanged=async name=>{
   assert(await page.evaluate(()=>nodesStable()),`${name}: live nodes remounted`);const g=await measure(name);
   for(const key of ['left','top','right','width','height']){close(g.plaque[key],reference.plaque[key],`${name}: stable plaque ${key}`);close(g.circle[key],reference.circle[key],`${name}: stable circle ${key}`);}close(g.absoluteCard.top,reference.absoluteCard.top,`${name}: card origin`);return g;
  };
  const expectedPalettes=await page.evaluate(()=>{
   const probe=document.createElement('span');probe.style.display='none';document.body.append(probe);
   const palettes=Object.fromEntries([
    ['local','var(--success-color)',11,30,'var(--success-color)'],
    ['offline','var(--error-color)',10,30,'var(--error-color)'],
    ['nodata','var(--secondary-text-color)',8,28,'var(--disabled-text-color)'],
   ].map(([tone,surface,fill,border,foreground])=>{
    probe.style.backgroundColor=`color-mix(in srgb,${surface} ${fill}%,var(--card-background-color))`;
    probe.style.borderTopColor=`color-mix(in srgb,${surface} ${border}%,var(--divider-color))`;
    probe.style.color=foreground;const css=getComputedStyle(probe);
    return [tone,{main:css.color,fresh:'rgb(102, 102, 102)',lamp:css.color,background:css.backgroundColor,border:css.borderTopColor}];
   }));probe.remove();return palettes;
  });
  const assertChannelPalette=(g,tone,name)=>{
   assert.deepEqual(g.palette,expectedPalettes[tone],`${name}: channel palette independent of freshness`);
   const peer=g.peerPalette.find(peer=>peer.room==='living');
   assert(peer.tone.split(/\s+/).includes(({local:'ok',offline:'bad',nodata:'nodata'})[tone]),`${name}: peer channel tone`);
   assert.equal(peer.lamp,expectedPalettes[tone].lamp,`${name}: peer/plaque channel lamps agree`);
  };
  // All 20 combinations are layout-only fixtures, not new domain states.
  for(const [label,tone]of [['Локально','local'],['Облако','cloud'],['Резерв','reserve'],['Нет связи','offline'],['Нет данных','nodata']]){
   for(const [fresh,modifier]of [['Данные актуальны','freshness-current'],['Данные устарели','freshness-stale'],['Нет данных','freshness-none'],['Получено в HA','freshness-unknown']]){
    await page.evaluate(c=>{fixtureConnection=c;p.patch();},{label,tone:`${tone} ${modifier}`,fresh});await settle();const g=await unchanged(`layout-only-${label}-${fresh}`);
    if(label==='Локально'&&fresh==='Получено в HA')assertChannelPalette(g,'local','received-in-HA fixture');
   }
  }
  await page.evaluate(()=>{fixtureConnection=null;p.patch();});await settle();
  for(const state of ['off','cool','heat','unavailable','off','unknown','cool','fan_only','dry','auto']){
   await page.evaluate(s=>{states['climate.living'].state=s;p.hass=makeHass();},state);await settle();const g=await unchanged(`actual-state-${state}`);
   const tone=state==='unavailable'?'offline':state==='unknown'?'nodata':'local';
   assert.equal(g.label,({local:'Локально',offline:'Нет связи',nodata:'Нет данных'})[tone],'channel label');
   assert.equal(g.freshness,tone==='local'?'Получено в HA':'Нет данных','no confirmed device sample claimed');
   assertChannelPalette(g,tone,`actual-state-${state}`);
  }
  for(const platform of ['other',null,'syncleo']){
   await page.evaluate(platform=>{p._entityRegistry.find(entry=>entry.entity_id==='climate.living').platform=platform;p.hass=makeHass();},platform);await settle();const g=await unchanged(`actual-platform-${platform}`);
   assert.equal(g.label,platform==='syncleo'?'Локально':'Нет данных');
   assert.equal(g.freshness,platform==='syncleo'?'Получено в HA':'Нет данных');
   assertChannelPalette(g,platform==='syncleo'?'local':'nodata',`actual-platform-${platform}`);
  }
  await page.evaluate(()=>{window.savedClimate=states['climate.living'];delete states['climate.living'];p.hass=makeHass();});await settle();const missing=await unchanged('actual-missing-entity');
  assert.equal(missing.label,'Нет данных');assert.equal(missing.freshness,'Нет данных');assertChannelPalette(missing,'nodata','actual-missing-entity');
  await page.evaluate(()=>{states['climate.living']=savedClimate;p.hass=makeHass();});await settle();assertChannelPalette(await unchanged('actual-entity-restored'),'local','actual-entity-restored');
  for(const title of ['Выкл.','Охлаждение','Ожидание завершения длительного цикла самоочистки внутреннего блока']){await page.evaluate(t=>p.shadowRoot.querySelector('.u154-mode strong').textContent=t,title);await settle();await unchanged(`adjacent-title-${title}`);}
  await page.evaluate(()=>{const img=p.shadowRoot.querySelector('.u154-photo-wrap img');window.imageSrc=img.src;img.src='/deliberately-missing-image.png';});await settle();await unchanged('image-not-loaded');
  await page.evaluate(()=>{p.shadowRoot.querySelector('.u154-photo-wrap img').src=imageSrc;p.patch();});await settle();
  await page.evaluate(()=>{window.releaseRefresh=null;p._hass=makeHass(()=>new Promise(resolve=>{window.releaseRefresh=resolve;}));window.refreshPromise=p.refreshSelected();});await settle();await unchanged('refresh-busy');
  await page.evaluate(async()=>{releaseRefresh();await refreshPromise;});await settle();await unchanged('refresh-success');
  await page.evaluate(async()=>{p._hass=makeHass(async()=>{throw new Error('fixture poll failed');});await p.refreshSelected();});await settle();await unchanged('refresh-error');
  await page.evaluate(()=>{p._hass=makeHass();clearTimeout(p.__refreshTimer158);p._refreshState158=null;p.patch();});
  for(let i=0;i<10;i++){await page.evaluate(i=>p.shadowRoot.querySelector(`.peer[data-room="${i%2?'living':'veranda'}"]`).click(),i);await settle();await unchanged(`peer-${i+1}`);}
  // Routes with no summary may unmount it. Return geometry must still be identical.
  for(let i=0;i<10;i++){await page.evaluate(i=>{p._tab=['control','diagnostics'][i%2];p.patch();},i);await settle();await page.evaluate(()=>{p._tab='summary';p.patch();});await settle();const g=await measure(`tab-return-${i+1}`);close(g.absoluteCard.top,reference.absoluteCard.top,'tab return card origin');}
  for(const [theme,background,primary]of [['light','#ffffff','#03a9d9'],['dark','#202124','#03a9d9'],['non-blue','#ffffff','#d81b60']]){await page.evaluate(({background,primary})=>{document.documentElement.style.setProperty('--card-background-color',background);document.documentElement.style.setProperty('--primary-color',primary);},{background,primary});await settle();await measure(`theme-${theme}`);}
  await page.evaluate(()=>{p.shadowRoot.querySelector('.viewport').scrollTop=20;});await settle();await measure('work-area-scroll');
  await page.evaluate(()=>p.shadowRoot.querySelector('.viewport').scrollTop=0);
  const nativeShell=(await page.evaluate(()=>geometry())).shellRects;
  for(const scale of [.75,1,1.5,2]){await page.evaluate(s=>p.setZoom158(s,null,{persist:false}),scale);await settle();const g=await measure(`zoom-${scale*100}`);close(g.scale,scale,'work scale');assert.deepEqual(g.shellRects,nativeShell,'header, peers and bottom menu remain at native scale');}
  // Trigger the real two-finger double-tap handler, rather than resetZoom158().
  await page.evaluate(()=>{const v=p.shadowRoot.querySelector('.viewport');const dispatch=(type,points)=>{const e=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,'touches',{value:points.map(([clientX,clientY])=>({clientX,clientY}))});v.dispatchEvent(e);};for(let i=0;i<2;i++){dispatch('touchstart',[[100,300],[200,300]]);dispatch('touchend',[]);}});await settle();const reset=await measure('two-finger-reset');close(reset.scale,1,'reset scale');
  if(shots)fs.writeFileSync(path.join(shots,'geometry-evidence.json'),JSON.stringify({baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'}).trim(),productionSHA256:createHash('sha256').update(fs.readFileSync(path.join(root,'nikas-climate-production.js'))).digest('hex'),browser:browser.version(),environment:'Chromium; mocked HA states/services/icons; actual HA Roboto fonts (roboto-fontface@0.10.0); production bundle and image assets',platformFonts,cases:evidence},null,2));
  console.log(`PASS production plaque/corner: ${evidence.length} cases; exact geometry/typography, stable DOM, safe-area fit, card breakpoint, themes, 75–200% zoom.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
