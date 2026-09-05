import "./nikas-climate-panel.js?v=1.2.3";

const Panel = customElements.get("nikas-climate-panel");
const PATCH_UI_VERSION = "1.2.3";

if (Panel && !Panel.prototype.__nikasUi123Patched) {
  const originalRender = Panel.prototype.render;
  const originalPatch = Panel.prototype.patch;

  // Peer lamps describe the conditioner/local channel, exactly like the main connection plaque.
  // A missing auxiliary room sensor is diagnostics, not a loss of conditioner communication.
  Panel.prototype.health = function (m) {
    if (!m?.climate || !m.available) return {tone:"bad", label:"Нет связи"};
    if (m.features?.error === "on") return {tone:"bad", label:"Ошибка кондиционера"};
    return {tone:"ok", label:"В норме"};
  };

  Panel.prototype.summary = function (m) {
    const delta=m.roomTemp!=null&&m.indoor!=null?m.indoor-m.roomTemp:null;
    const deltaText=delta==null?"—":`${delta>0?"+":""}${delta.toFixed(1)} °C`;
    const night=this.boolLabel(m.features?.night), turbo=this.boolLabel(m.features?.turbo);
    return `<section class="card hero summary-card">
      <div class="hero-top summary-head"><div><div class="room-title">${m.room.title}</div><div class="area">${m.room.area}</div></div>${this.connectionPlaque(m)}</div>
      <div class="climate-core summary-climate"><div class="primary-temp"><span class="eyebrow">Температура помещения</span><strong class="temp-main">${this.fmt(m.roomTemp,1)}°</strong><small class="temp-sub">Контрольный датчик помещения</small></div><div class="metric-stack"><div class="metric"><span>Уставка</span><strong>${this.fmt(m.target,0)} °C</strong><small>Целевая температура</small></div><div class="metric"><span>Внутренний блок</span><strong>${this.fmt(m.indoor,0)} °C</strong><small>Датчик кондиционера</small></div></div></div>
      <div class="report-title">Режим работы</div><div class="status-strip summary-status">
        <div class="status-item"><ha-icon icon="${this.modeIcon(m.mode)}"></ha-icon><span>Режим</span><strong>${this.modeLabel(m.mode)}</strong></div>
        <div class="status-item"><ha-icon icon="${this.fanIcon(m.fan)}"></ha-icon><span>Вентилятор</span><strong>${this.fanLabel(m.fan)}</strong></div>
        <div class="status-item"><ha-icon icon="${this.flapIcon(m.swing)}"></ha-icon><span>Створка</span><strong>${this.flapLabel(m.swing)}</strong></div>
        <div class="status-item ${m.features?.night==="on"?"active":""}"><ha-icon icon="mdi:weather-night"></ha-icon><span>Ночной</span><strong>${night}</strong></div>
        <div class="status-item ${m.features?.turbo==="on"?"active":""}"><ha-icon icon="mdi:rocket-launch-outline"></ha-icon><span>Турбо</span><strong>${turbo}</strong></div>
        <div class="status-item"><ha-icon icon="mdi:thermometer-lines"></ha-icon><span>Δ датчиков</span><strong>${deltaText}</strong></div>
      </div>${this.historyCard(m)}
    </section>`;
  };

  Panel.prototype.control = function (m) {
    if (!m.climate) return `<section class="card"><div class="section-title">Управление</div><p class="notice">Climate-сущность выбранного кондиционера не найдена.</p></section>`;
    const d=this.draftFor(m); d.dirty=d.dirty||this.draftChanged(m,d);
    const modes=[["off","Выкл.","mdi:power"],["cool","Холод","mdi:snowflake"],["heat","Тепло","mdi:fire"],["auto","Авто","mdi:autorenew"],["dry","Сушка","mdi:water-percent"],["fan_only","Вент.","mdi:fan"]];
    const fans=[["auto","Авто","mdi:fan-auto"],["low","Низкая","mdi:fan-speed-1"],["medium","Средняя","mdi:fan-speed-2"],["high","Высокая","mdi:fan-speed-3"]];
    const tempChanged=m.target!=null&&Number(d.target)!==Number(m.target);
    const action=(current,target,attr,value,icon,label)=>{const cls=["action"];if(current===value)cls.push("current");if(target===value&&target!==current)cls.push("target");return `<button class="${cls.join(" ")}" data-${attr}="${value}" ${d.applying?"disabled":""}><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`;};
    const flapKnown=m.swing&&!["—","unavailable","unknown"].includes(m.swing);
    const flapChanged=d.swing!==m.swing;
    const flapClass=flapChanged?"target":(flapKnown?"current":"");
    const flapTarget=this.flapLabel(d.swing);
    return `<section class="card control-card"><div class="page-head"><div class="room-title">${m.room.title}</div><div class="area">${m.room.area}</div></div>
      <div class="setpoint setpoint-with-flap"><button data-delta="-1" ${d.applying?"disabled":""}>−</button><div class="setpoint-center"><div class="num ${tempChanged?"target":""}">${this.fmt(d.target,0)}°</div><span class="setpoint-current">Сейчас ${this.fmt(m.target,0)}°</span></div><button data-delta="1" ${d.applying?"disabled":""}>+</button><button class="setpoint-flap ${flapClass}" data-flap ${d.applying?"disabled":""}><ha-icon icon="${this.flapIcon(d.swing)}"></ha-icon><span>Створка</span><small>${flapTarget}</small></button></div>
      <div class="control-section"><div class="control-label">Режим</div><div class="modes">${modes.map(([v,t,i])=>action(m.mode,d.mode,"mode",v,i,t)).join("")}</div></div>
      <div class="control-section"><div class="control-label">Вентилятор</div><div class="fan-modes">${fans.map(([v,t,i])=>action(m.fan,d.fan,"fan",v,i,t)).join("")}</div></div>
      ${(m.features?.night!=null||m.features?.turbo!=null)?`<div class="control-section"><div class="control-label">Дополнительно</div><div class="feature-grid compact-features">
        ${m.features?.night!=null?`<button class="action ${m.features.night===d.night?(d.night==="on"?"current":""):"target"}" data-feature="night" ${d.applying?"disabled":""}><ha-icon icon="mdi:weather-night"></ha-icon><span>Ночной<br>${this.boolLabel(d.night)}</span></button>`:""}
        ${m.features?.turbo!=null?`<button class="action ${m.features.turbo===d.turbo?(d.turbo==="on"?"current":""):"target"}" data-feature="turbo" ${d.applying?"disabled":""}><ha-icon icon="mdi:rocket-launch-outline"></ha-icon><span>Турбо<br>${this.boolLabel(d.turbo)}</span></button>`:""}
      </div></div>`:""}
      <div class="legend"><span><i class="current-dot"></i>Текущее</span><span><i class="target-dot"></i>Целевое</span></div>
      <button class="apply" data-apply ${(!d.dirty||d.applying)?"disabled":""}>${d.applying?"Применяется…":"Применить"}</button>
      ${d.error?`<p class="notice error">${d.error}</p>`:""}<p class="notice control-note">Все изменения накапливаются и отправляются одной кнопкой «Применить». ИК-пульт работает независимо и не синхронизирует свой экран с Wi‑Fi.</p>
    </section>`;
  };

  Panel.prototype.render = function (...args) {
    const result = originalRender.apply(this, args);
    const version = this.shadowRoot?.querySelector(".header-title span");
    if (version) version.textContent = `UI v${PATCH_UI_VERSION}`;
    this.__installNikasUi123?.();
    this.__installNikasScrollBoundary?.();
    return result;
  };

  Panel.prototype.patch = function (...args) {
    const result = originalPatch.apply(this, args);
    const root=this.shadowRoot;
    const viewport=root?.querySelector(".viewport");
    const content=root?.querySelector(".content");
    const version=root?.querySelector(".header-title span");
    if(version) version.textContent=`UI v${PATCH_UI_VERSION}`;
    viewport?.classList.toggle("summary-fit",this._tab==="summary");
    content?.classList.toggle("summary-fit-content",this._tab==="summary");
    return result;
  };

  Panel.prototype.__installNikasUi123 = function () {
    const root=this.shadowRoot;
    if(!root || root.querySelector("style[data-nikas-ui123]")) return;
    const style=document.createElement("style");
    style.dataset.nikasUi123="1";
    style.textContent=`
      /* Summary is an operational screen: it must use the whole working viewport without scrolling. */
      .viewport.summary-fit{overflow-y:hidden!important;}
      .summary-fit-content{height:100%!important;min-height:0!important;padding:8px 12px!important;display:block!important;}
      .summary-fit-content>#content{height:100%!important;min-height:0!important;}
      .summary-card{height:100%!important;min-height:0!important;margin:0!important;padding:12px!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;}
      .summary-card .summary-head{flex:0 0 auto;gap:8px;}
      .summary-card .room-title{font-size:23px;}
      .summary-card .area{margin-top:3px;}
      .summary-card .connection-indicator{min-height:52px;padding:9px 11px;}
      .summary-card .connection-copy{row-gap:2px;}
      .summary-card .connection-copy strong{font-size:15px;}
      .summary-card .connection-copy small{font-size:12px;}
      .summary-card .summary-climate{flex:0 0 auto;margin-top:8px;gap:8px;}
      .summary-card .primary-temp{min-height:96px;padding:11px 14px;}
      .summary-card .temp-main{font-size:47px;margin-top:2px;}
      .summary-card .temp-sub{margin-top:4px;font-size:12px;}
      .summary-card .metric-stack{gap:8px;}
      .summary-card .metric{padding:8px 11px;min-height:0;}
      .summary-card .metric strong{font-size:21px;margin-top:3px;}
      .summary-card .metric small{font-size:11px;margin-top:3px;}
      .summary-card .report-title{margin-top:7px;font-size:12px;}
      .summary-card .summary-status{flex:0 0 auto;gap:6px;margin-top:5px;}
      .summary-card .status-item{min-height:63px;padding:4px;border-radius:15px;}
      .summary-card .status-item ha-icon{--mdc-icon-size:24px;margin-bottom:2px;}
      .summary-card .status-item span{font-size:10.5px;}
      .summary-card .status-item strong{font-size:12.5px;margin-top:1px;}
      .summary-card .chart-card{flex:1 1 0!important;min-height:118px!important;margin-top:7px;padding:8px 10px;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;}
      .summary-card .chart-head{flex:0 0 auto;}
      .summary-card .chart-head strong{font-size:12px;}
      .summary-card .chart-head small{font-size:10px;}
      .summary-card .chart-wrap{flex:1 1 auto!important;min-height:76px!important;height:auto!important;margin-top:4px;}
      .summary-card .chart-empty{flex:1 1 auto!important;min-height:76px!important;height:auto!important;}
      .summary-card .chart-legend{flex:0 0 auto;margin-top:2px;font-size:9.5px;gap:10px;}

      /* Control icons are operational, not decorative: keep them clearly readable. */
      .control-card .action ha-icon{--mdc-icon-size:31px!important;}
      .control-card .action{min-height:82px!important;gap:7px!important;}
      .control-card .fan-modes .action ha-icon{--mdc-icon-size:29px!important;}

      /* Four fan speeds always occupy one row. */
      .fan-modes{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:7px!important;}
      .fan-modes .action{min-width:0;padding-inline:3px;font-size:11.5px;}

      /* Setpoint order: minus, temperature, plus, flap. */
      .setpoint-with-flap{grid-template-columns:54px minmax(0,1fr) 54px 84px!important;gap:7px!important;}
      .setpoint-with-flap>button:not(.setpoint-flap){height:58px!important;}
      .setpoint-flap{height:66px!important;border:1px solid color-mix(in srgb,var(--divider-color) 70%,transparent)!important;border-radius:17px!important;background:var(--card-background-color)!important;color:var(--primary-text-color)!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;padding:4px!important;font-size:11px!important;}
      .setpoint-flap ha-icon{--mdc-icon-size:27px!important;}
      .setpoint-flap span{font-weight:750;line-height:1;}
      .setpoint-flap small{font-size:9.5px;line-height:1.1;color:var(--secondary-text-color);white-space:nowrap;}
      .setpoint-flap.current{background:color-mix(in srgb,var(--primary-color) 10%,var(--card-background-color))!important;border-color:color-mix(in srgb,var(--primary-color) 52%,var(--divider-color))!important;color:var(--primary-color)!important;}
      .setpoint-flap.target{background:color-mix(in srgb,var(--success-color,#43a047) 12%,var(--card-background-color))!important;border-color:color-mix(in srgb,var(--success-color,#43a047) 54%,var(--divider-color))!important;color:var(--success-color,#43a047)!important;}
      .compact-features{grid-template-columns:repeat(2,minmax(0,1fr))!important;}

      /* The explanatory note is secondary; keep it below the initial working screen. */
      .control-note{margin-top:110px!important;padding-top:12px;border-top:1px solid color-mix(in srgb,var(--divider-color) 65%,transparent);}

      @media(max-width:480px){
        .summary-card .summary-climate{grid-template-columns:1fr!important;}
        .summary-card .metric-stack{grid-template-columns:1fr 1fr!important;grid-template-rows:auto!important;}
        .summary-card .primary-temp{min-height:90px!important;}
        .summary-card .temp-main{font-size:45px!important;}
      }
      @media(max-height:760px){
        .summary-fit-content{padding-block:6px!important;}
        .summary-card{padding:10px!important;}
        .summary-card .primary-temp{min-height:80px!important;}
        .summary-card .temp-main{font-size:41px!important;}
        .summary-card .status-item{min-height:56px!important;}
        .summary-card .chart-card{min-height:96px!important;}
        .control-note{margin-top:80px!important;}
      }
      @media(max-width:360px){
        .fan-modes{grid-template-columns:repeat(4,minmax(0,1fr))!important;}
        .fan-modes .action{font-size:10.5px!important;}
        .setpoint-with-flap{grid-template-columns:48px minmax(0,1fr) 48px 76px!important;}
      }
    `;
    root.appendChild(style);
  };

  Panel.prototype.__installNikasScrollBoundary = function () {
    const root = this.shadowRoot;
    const viewport = root?.querySelector(".viewport");
    const shell = root?.querySelector(".shell");
    if (!viewport || viewport.dataset.nikasScrollBoundary === "1") return;
    viewport.dataset.nikasScrollBoundary = "1";

    const style = document.createElement("style");
    style.textContent = `
      :host{position:fixed!important;inset:0!important;overflow:hidden!important;overscroll-behavior:none!important;}
      .shell{position:absolute!important;inset:0!important;overflow:hidden!important;overscroll-behavior:none!important;touch-action:none;}
      .app-header,.peer-selector,.bottom-nav{touch-action:manipulation;overscroll-behavior:none!important;}
      .viewport{min-height:0!important;overflow-y:auto;overflow-x:hidden!important;overscroll-behavior-x:none!important;overscroll-behavior-y:contain!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch;}
      .content{min-height:100%;}
    `;
    root.appendChild(style);

    let startY=0,startX=0;
    viewport.addEventListener("touchstart",(event)=>{const t=event.touches?.[0];if(!t)return;startY=t.clientY;startX=t.clientX;},{passive:true});
    viewport.addEventListener("touchmove",(event)=>{const t=event.touches?.[0];if(!t)return;const dy=t.clientY-startY,dx=t.clientX-startX;if(Math.abs(dx)>Math.abs(dy)){event.preventDefault();return;}const atTop=viewport.scrollTop<=0;const atBottom=viewport.scrollTop+viewport.clientHeight>=viewport.scrollHeight-1;if((atTop&&dy>0)||(atBottom&&dy<0))event.preventDefault();},{passive:false});
    viewport.addEventListener("wheel",(event)=>{const atTop=viewport.scrollTop<=0;const atBottom=viewport.scrollTop+viewport.clientHeight>=viewport.scrollHeight-1;if((atTop&&event.deltaY<0)||(atBottom&&event.deltaY>0))event.preventDefault();},{passive:false});
    if(shell)shell.scrollTop=0;
  };

  Panel.prototype.__nikasUi123Patched = true;
}
