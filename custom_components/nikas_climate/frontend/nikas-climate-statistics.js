// HA owns history loading, gaps, timestamps and Recorder error handling.
const Panel = customElements.get("nikas-climate-panel");
const escapeHtml = value => String(value ?? "—").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
if (Panel && !Panel.prototype.__statistics154) {
  Panel.prototype.statistics = function(m) {
    const hours = this._statisticsHours || 24;
    return `<section class="card statistics-card"><div class="section-title">Статистика</div>
      <div class="area">${escapeHtml(m.room.title)}</div>
      <div class="statistics-periods" role="group" aria-label="Период истории">${[24,168].map(h=>`<button data-history-hours="${h}" aria-pressed="${h===hours}">${h===24?"24 часа":"7 дней"}</button>`).join("")}</div>
      <div data-history-chart="temperature"></div><div data-history-chart="humidity"></div>
      <p class="notice">История Home Assistant. Температура — комнатный датчик, влажность — датчик помещения. Пробелы в истории не заменяются нулями.</p></section>`;
  };
  Panel.prototype.mountStatistics154 = async function() {
    if(this._tab!=="statistics")return;
    const root=this.shadowRoot;
    root.querySelectorAll("[data-history-hours]").forEach(button=>button.onclick=()=>{this._statisticsHours=Number(button.dataset.historyHours);this.patch();});
    const room={key:this._selected};
    const m=this.roomModel(room);
    const sources=[["temperature",m.roomTempEntity,"Температура помещения"],["humidity",m.humidityEntity,"Влажность"]];
    const hours=this._statisticsHours||24;
    for(const [kind,entity,title] of sources){
      const slot=root.querySelector(`[data-history-chart="${kind}"]`);
      if(!slot)continue;
      if(!entity){slot.textContent=`${title}: датчик не выбран`;continue;}
      const key=`${kind}:${entity}:${hours}`;
      this._statisticsCards ||= new Map();
      let card=this._statisticsCards.get(key);
      if(!card){
        slot.textContent="Загрузка истории…";
        try {
          if(!window.loadCardHelpers)throw new Error("helpers unavailable");
          this._statisticsHelpers ||= window.loadCardHelpers();
          const helpers=await this._statisticsHelpers;
          card=helpers.createCardElement({type:"history-graph",title,hours_to_show:hours,entities:[{entity,name:title}]});
          this._statisticsCards.set(key,card);
        }catch(_error){this._statisticsHelpers=null;slot.textContent="Не удалось загрузить график. Повторите открытие вкладки.";continue;}
      }
      if(!slot.isConnected)continue;
      card.hass=this._hass;
      slot.replaceChildren(card);
    }
  };
  const patch=Panel.prototype.patch;
  Panel.prototype.patch=function(...args){const result=patch.apply(this,args);this.mountStatistics154();return result;};
  Panel.prototype.__statistics154=true;
}
