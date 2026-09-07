const Panel=customElements.get('nikas-climate-panel');
const escape155=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const numeric155=v=>v==null||String(v).trim()===''?null:(Number.isFinite(Number(v))?Number(v):null);
if(Panel&&!Panel.prototype.__history155){
 Panel.prototype.parseRoomHistory155=function(raw,entity){
  if(!Array.isArray(raw))throw Error('Invalid history response');
  const points=[];
  for(const group of raw){if(!Array.isArray(group))continue;const id=group.find(x=>x.entity_id)?.entity_id;
   for(const item of group){if((item.entity_id||id)!==entity)continue;const t=Date.parse(item.last_updated||item.last_changed);if(Number.isFinite(t))points.push([t,numeric155(item.state)]);}
  }
  return points.sort((a,b)=>a[0]-b[0]);
 };
 Panel.prototype.drawRoomHistory155=function(points,start,end,unit){
  const valid=points.filter(p=>p[1]!=null);if(!valid.length)return '<p>За выбранный период измерений нет.</p>';
  let low=Infinity,high=-Infinity;for(const [,v] of valid){low=Math.min(low,v);high=Math.max(high,v);}const pad=Math.max((high-low)*.1,.5);low-=pad;high+=pad;
  const x=t=>40+Math.max(0,Math.min(1,(t-start)/(end-start)))*270;
  const y=v=>130-(v-low)/(high-low)*110;
  let d='',active=false;
  for(const [t,v] of points){const px=x(t);if(v==null){if(active)d+=`H${px.toFixed(1)}`;active=false;continue;}const py=y(v);d+=active?`H${px.toFixed(1)}V${py.toFixed(1)}`:`M${px.toFixed(1)},${py.toFixed(1)}`;active=true;}
  if(active)d+='H310';
  const time=t=>new Intl.DateTimeFormat(this._hass?.locale?.language||'ru',{timeZone:this._hass?.config?.time_zone||undefined,day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(t);
  const ticks=[low,(low+high)/2,high].map(v=>`<line x1="40" x2="310" y1="${y(v)}" y2="${y(v)}" stroke="var(--divider-color)"/><text x="34" y="${y(v)+4}" text-anchor="end">${v.toFixed(1)}</text>`).join('');
  return `<svg viewBox="0 0 330 170" role="img" aria-label="История измерений, ${unit}"><text x="4" y="12">${unit}</text>${ticks}<path data-history-line d="${d}" fill="none" stroke="var(--primary-color)" stroke-width="2"/><text x="40" y="153">${escape155(time(start))}</text><text x="310" y="153" text-anchor="end">${escape155(time(end))}</text></svg><p>Мин. ${(low+pad).toFixed(1)} ${unit} · Макс. ${(high-pad).toFixed(1)} ${unit}</p>`;
 };
 Panel.prototype.mountStatistics154=async function(){
  if(this._tab!=='statistics')return;
  const root=this.shadowRoot,m=this.roomModel({key:this._selected}),hours=this._statisticsHours||24;
  root.querySelectorAll('[data-history-hours]').forEach(b=>b.onclick=()=>{this._statisticsHours=Number(b.dataset.historyHours);this.patch();});
  this._roomHistory155 ||= new Map();
  await Promise.all([['temperature',m.roomTempEntity,'Температура помещения','°C'],['humidity',m.humidityEntity,'Влажность','%']].map(async([kind,entity,title,unit])=>{
   const slot=root.querySelector(`[data-history-chart="${kind}"]`);if(!slot)return;
   slot.classList.add('history155');
   const heading=`<h3>${title}</h3>`;
   if(!entity){slot.innerHTML=heading+'<p>Датчик не выбран.</p>';return;}
   const key=`${entity}:${hours}`;let record=this._roomHistory155.get(key);
   if(!record||Date.now()-record.loaded>60000){
    const end=Date.now(),start=end-hours*3600000;record={loaded:Date.now(),start,end};
    record.promise=(async()=>{try{
     if(!this._hass?.callApi)throw Error('History API unavailable');
     const url=`history/period/${encodeURIComponent(new Date(start).toISOString())}?end_time=${encodeURIComponent(new Date(end).toISOString())}&filter_entity_id=${encodeURIComponent(entity)}&minimal_response=false&no_attributes=true`;
     const raw=await this._hass.callApi('GET',url);return {points:this.parseRoomHistory155(raw,entity)};
    }catch(error){return {error:true};}})();this._roomHistory155.set(key,record);
   }
   slot.innerHTML=heading+'<p>Загрузка истории…</p>';
   const data=await record.promise;if(!slot.isConnected)return;
   if(data.error){slot.innerHTML=heading+'<p>Не удалось получить историю Home Assistant.</p><button data-history-retry>Повторить</button>';slot.querySelector('button').onclick=()=>{this._roomHistory155.delete(key);this.mountStatistics154();};return;}
   slot.innerHTML=heading+this.drawRoomHistory155(data.points,record.start,record.end,unit);
  }));
 };
 Panel.prototype.__history155=true;
}
