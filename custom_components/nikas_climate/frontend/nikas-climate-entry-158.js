import "./nikas-climate-entry-156.js?v=1.4.16";

const Panel = customElements.get("nikas-climate-panel");
const UI158 = "1.4.19";
const TRANSFORM_KEY158 = "nikas_climate.view_transform.v2";
const PEERS158 = [
  {
    key: "living",
    title: "Зал",
    area: "11.2 · Гостиная",
    climateNames: ["Кондиционер в зале", "Кондей в Гостиной"],
    explicitRoomTempEntity: "sensor.sensor_th_zb_11_temperature",
    explicitHumidityEntity: "sensor.sensor_th_zb_11_humidity",
  },
  {
    key: "veranda",
    title: "Веранда",
    area: "14 · Веранда",
    climateNames: ["Кондиционер на веранде", "Кондей на Веранде"],
    explicitRoomTempEntity: "sensor.sensor_th_zb_14_temperature",
    explicitHumidityEntity: "sensor.sensor_th_zb_14_humidity",
  },
];

const clamp158 = (value, min, max) => Math.max(min, Math.min(max, value));
const distance158 = (touches) => Math.hypot(
  touches[0].clientX - touches[1].clientX,
  touches[0].clientY - touches[1].clientY,
);
const midpoint158 = (touches, viewport) => {
  const rect = viewport.getBoundingClientRect();
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
    y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top,
  };
};
const frame158 = (callback) => (
  typeof requestAnimationFrame === "function"
    ? requestAnimationFrame(callback)
    : setTimeout(callback, 0)
);

const compatible158 = (current, fresh) => (
  current?.nodeType === fresh?.nodeType
  && (current.nodeType !== 1 || current.tagName === fresh.tagName)
);

const morph158 = (current, fresh) => {
  if (!compatible158(current, fresh)) {
    current.replaceWith(fresh);
    return fresh;
  }
  if (current.nodeType === 3) {
    if (current.nodeValue !== fresh.nodeValue) current.nodeValue = fresh.nodeValue;
    return current;
  }
  for (const attribute of [...current.attributes]) {
    if (!fresh.hasAttribute(attribute.name)) current.removeAttribute(attribute.name);
  }
  for (const attribute of [...fresh.attributes]) {
    if (current.getAttribute(attribute.name) !== attribute.value) {
      current.setAttribute(attribute.name, attribute.value);
    }
  }
  current.onclick = fresh.onclick;
  const oldChildren = [...current.childNodes];
  const newChildren = [...fresh.childNodes];
  for (let index = 0; index < Math.max(oldChildren.length, newChildren.length); index += 1) {
    const oldChild = oldChildren[index];
    const newChild = newChildren[index];
    if (!oldChild && newChild) {
      current.append(newChild);
      continue;
    }
    if (oldChild && !newChild) {
      oldChild.remove();
      continue;
    }
    morph158(oldChild, newChild);
  }
  return current;
};

if (Panel && !Panel.prototype.__ui158) {
  const previousRender = Panel.prototype.render;
  const previousPatch = Panel.prototype.patch;
  const previousDiagnostics = Panel.prototype.diagnostics;

  Panel.prototype.__viewKey158 = function() {
    return `${TRANSFORM_KEY158}:${this._selected || "living"}:${this._tab || "summary"}`;
  };

  Panel.prototype.__readTransform158 = function() {
    try {
      const value = JSON.parse(localStorage.getItem(this.__viewKey158()) || "null");
      const scale = clamp158(Number(value?.scale) || 1, 0.75, 2);
      return {
        scale: Math.round(scale * 100) / 100,
        x: Number.isFinite(Number(value?.x)) ? Number(value.x) : 0,
        y: Number.isFinite(Number(value?.y)) ? Number(value.y) : 0,
      };
    } catch (_error) {
      return {scale: 1, x: 0, y: 0};
    }
  };

  Panel.prototype.__saveTransform158 = function() {
    const state = this._transform158 || {scale: 1, x: 0, y: 0};
    localStorage.setItem(this.__viewKey158(), JSON.stringify(state));
  };

  Panel.prototype.__clampTransform158 = function(state = this._transform158) {
    const viewport = this.shadowRoot?.querySelector(".viewport");
    const content = this.shadowRoot?.querySelector(".content");
    if (!viewport || !content || !state) return state;
    state.scale = Math.round(clamp158(Number(state.scale) || 1, 0.75, 2) * 1000) / 1000;
    if (state.scale <= 1) {
      state.x = state.scale < 1
        ? Math.max(0, (viewport.clientWidth - content.offsetWidth * state.scale) / 2)
        : 0;
      state.y = 0;
      return state;
    }
    const minimumX = Math.min(0, viewport.clientWidth - content.offsetWidth * state.scale);
    const minimumY = Math.min(0, viewport.clientHeight - content.scrollHeight * state.scale);
    state.x = clamp158(Number(state.x) || 0, minimumX, 0);
    state.y = clamp158(Number(state.y) || 0, minimumY, 0);
    return state;
  };

  Panel.prototype.__applyTransform158 = function({persist = false} = {}) {
    const viewport = this.shadowRoot?.querySelector(".viewport");
    const content = this.shadowRoot?.querySelector(".content");
    if (!viewport || !content) return;
    const state = this.__clampTransform158(this._transform158 || {scale: 1, x: 0, y: 0});
    this._transform158 = state;
    const zoomed = state.scale > 1;
    viewport.dataset.zoomed = zoomed ? "1" : "0";
    viewport.dataset.scale = String(Math.round(state.scale * 100));
    content.style.zoom = "";
    content.style.marginBottom = state.scale < 1
      ? `${-content.scrollHeight * (1 - state.scale)}px`
      : "";
    content.style.transform = state.scale === 1
      ? ""
      : `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`;
    if (zoomed && (viewport.scrollTop || viewport.scrollLeft)) {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
    }
    if (persist) this.__saveTransform158();
  };

  Panel.prototype.setZoom158 = function(value, focus = null, {persist = true} = {}) {
    const viewport = this.shadowRoot?.querySelector(".viewport");
    if (!viewport) return;
    const previous = this._transform158 || {scale: 1, x: 0, y: 0};
    const nextScale = Math.round(clamp158(Number(value) || 1, 0.75, 2) * 1000) / 1000;
    const point = focus || {x: viewport.clientWidth / 2, y: viewport.clientHeight / 2};
    const effectiveX = previous.x || 0;
    const effectiveY = (previous.y || 0) - (previous.scale <= 1 ? viewport.scrollTop : 0);
    const localX = (point.x - effectiveX) / previous.scale;
    const localY = (point.y - effectiveY) / previous.scale;
    if (nextScale > 1) {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
    }
    this._transform158 = {
      scale: nextScale,
      x: point.x - localX * nextScale,
      y: point.y - localY * nextScale,
    };
    this.__applyTransform158({persist});
  };

  Panel.prototype.__showZoomReset158 = function() {
    const root = this.shadowRoot;
    const toast = root?.querySelector(".u158-zoom-status");
    if (!toast) return;
    toast.textContent = "Масштаб 100%";
    toast.dataset.show = "1";
    clearTimeout(this.__zoomToastTimer158);
    this.__zoomToastTimer158 = setTimeout(() => { toast.dataset.show = "0"; }, 1200);
  };

  Panel.prototype.resetZoom158 = function({announce = true} = {}) {
    const viewport = this.shadowRoot?.querySelector(".viewport");
    this._transform158 = {scale: 1, x: 0, y: 0};
    if (viewport) {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
    }
    this.__applyTransform158({persist: true});
    if (announce) this.__showZoomReset158();
  };

  Panel.prototype.__loadViewTransform158 = function({resetScroll = false} = {}) {
    const viewport = this.shadowRoot?.querySelector(".viewport");
    this._transform158 = this.__readTransform158();
    if (resetScroll && viewport) {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
    }
    frame158(() => this.__applyTransform158());
  };

  Panel.prototype.__finishGesture158 = function(gesture) {
    if (!gesture) return;
    this._u158GestureActive = false;
    const scale = this._transform158?.scale || 1;
    if (gesture.kind === "pinch" && scale >= 0.97 && scale <= 1.03) {
      this.resetZoom158();
    } else {
      this.__applyTransform158({persist: true});
    }
    if (this._u158PatchQueued) {
      this._u158PatchQueued = false;
      this.patch();
    }
  };

  Panel.prototype.__installZoom158 = function() {
    const viewport = this.shadowRoot?.querySelector(".viewport");
    if (!viewport || viewport.dataset.zoom158 === "1") return;
    viewport.dataset.zoom158 = "1";
    this.__loadViewTransform158();
    let gesture = null;
    let lastTwoFingerTap = 0;

    viewport.addEventListener("touchstart", (event) => {
      if (event.touches.length === 2) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const center = midpoint158(event.touches, viewport);
        const state = this._transform158 || {scale: 1, x: 0, y: 0};
        gesture = {
          kind: "pinch",
          distance: Math.max(1, distance158(event.touches)),
          scale: state.scale,
          x: state.x || 0,
          y: (state.y || 0) - (state.scale <= 1 ? viewport.scrollTop : 0),
          center,
          started: Date.now(),
          moved: false,
        };
        this._u158GestureActive = true;
      } else if (event.touches.length === 1 && (this._transform158?.scale || 1) > 1) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const touch = event.touches[0];
        gesture = {
          kind: "pan",
          clientX: touch.clientX,
          clientY: touch.clientY,
          x: this._transform158.x,
          y: this._transform158.y,
          moved: false,
        };
        this._u158GestureActive = true;
      }
    }, {capture: true, passive: false});

    viewport.addEventListener("touchmove", (event) => {
      if (!gesture) return;
      if (gesture.kind === "pinch" && event.touches.length === 2) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const center = midpoint158(event.touches, viewport);
        const nextScale = clamp158(
          gesture.scale * distance158(event.touches) / gesture.distance,
          0.75,
          2,
        );
        const localX = (gesture.center.x - gesture.x) / gesture.scale;
        const localY = (gesture.center.y - gesture.y) / gesture.scale;
        if (nextScale > 1) {
          viewport.scrollTop = 0;
          viewport.scrollLeft = 0;
        }
        this._transform158 = {
          scale: nextScale,
          x: center.x - localX * nextScale,
          y: center.y - localY * nextScale,
        };
        gesture.moved = gesture.moved || Math.abs(nextScale - gesture.scale) > 0.012;
        this.__applyTransform158();
      } else if (gesture.kind === "pan" && event.touches.length === 1) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const touch = event.touches[0];
        const dx = touch.clientX - gesture.clientX;
        const dy = touch.clientY - gesture.clientY;
        gesture.moved = gesture.moved || Math.hypot(dx, dy) > 4;
        this._transform158 = {
          scale: this._transform158.scale,
          x: gesture.x + dx,
          y: gesture.y + dy,
        };
        this.__applyTransform158();
      }
    }, {capture: true, passive: false});

    viewport.addEventListener("touchend", (event) => {
      if (!gesture || event.touches.length) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const finished = gesture;
      gesture = null;
      if (finished.kind === "pinch" && !finished.moved && Date.now() - finished.started < 320) {
        const now = Date.now();
        if (now - lastTwoFingerTap < 380) {
          lastTwoFingerTap = 0;
          this._suppressClickUntil158 = now + 450;
          this.resetZoom158();
          this._u158GestureActive = false;
          if (this._u158PatchQueued) {
            this._u158PatchQueued = false;
            this.patch();
          }
          return;
        }
        lastTwoFingerTap = now;
      }
      this._suppressClickUntil158 = Date.now() + (finished.moved ? 450 : 120);
      this.__finishGesture158(finished);
    }, {capture: true, passive: false});

    viewport.addEventListener("touchcancel", () => {
      const finished = gesture;
      gesture = null;
      this.__finishGesture158(finished);
    }, {capture: true});
    viewport.addEventListener("click", (event) => {
      if (Date.now() < (this._suppressClickUntil158 || 0)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, {capture: true});
    for (const name of ["gesturestart", "gesturechange", "gestureend"]) {
      viewport.addEventListener(name, (event) => event.preventDefault(), {passive: false});
    }

    if (typeof ResizeObserver !== "undefined") {
      this.__zoomResize158 = new ResizeObserver(() => {
        frame158(() => this.__applyTransform158({persist: true}));
      });
      this.__zoomResize158.observe(viewport);
    }
  };

  Panel.prototype.refreshSelected = async function() {
    if (this._refreshing || !this._hass) return;
    const token = (this._refreshToken158 || 0) + 1;
    this._refreshToken158 = token;
    clearTimeout(this.__refreshTimer158);
    const started = Date.now();
    this._refreshing = true;
    this._refreshState158 = "working";
    this._refreshMessage158 = "Обновление…";
    this.patch();
    try {
      const room = PEERS158.find((item) => item.key === this._selected) || PEERS158[0];
      const model = this.roomModel(room);
      const entities = [...new Set([
        model.climate?.entity_id,
        model.roomTempEntity,
        model.humidityEntity,
        ...Object.values(model.featureEntities || {}),
      ].filter(Boolean))];
      if (!entities.length) throw new Error("Сущности выбранного кондиционера не найдены");
      await this._hass.callService("homeassistant", "update_entity", {entity_id: entities});
      const remaining = 900 - (Date.now() - started);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      if (token !== this._refreshToken158) return;
      if (this._history) delete this._history[room.key];
      if (this._roomHistory155?.clear) this._roomHistory155.clear();
      this._refreshState158 = "ok";
      this._refreshMessage158 = "Запрос принят Home Assistant";
    } catch (reason) {
      if (token !== this._refreshToken158) return;
      const remaining = 900 - (Date.now() - started);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      this._refreshState158 = "error";
      this._refreshMessage158 = `Не удалось обновить: ${reason?.message || reason}`;
    } finally {
      if (token !== this._refreshToken158) return;
      this._refreshing = false;
      this.patch();
      this.__refreshTimer158 = setTimeout(() => {
        if (token !== this._refreshToken158) return;
        this._refreshState158 = null;
        this._refreshMessage158 = null;
        this.patch();
      }, 1400);
    }
  };

  Panel.prototype.diagnostics = function(...args) {
    return previousDiagnostics.apply(this, args).replace(
      "принудительно обновляет выбранный Syncleo config entry и перечитывает состояние",
      "запрашивает у Home Assistant актуальные состояния сущностей выбранного кондиционера",
    );
  };

  Panel.prototype.__installUi158 = function() {
    const root = this.shadowRoot;
    if (!root) return;
    let style = root.querySelector("style[data-ui158]");
    if (!style) {
      style = document.createElement("style");
      style.dataset.ui158 = "1";
      style.textContent = `
        .viewport{scroll-padding-bottom:34px}
        .content{padding:12px 12px calc(38px + env(safe-area-inset-bottom))!important;transform-origin:top left;will-change:transform}
        .viewport[data-zoomed="1"]{overflow:hidden!important;touch-action:none!important;cursor:grab}
        .viewport[data-zoomed="1"]:active{cursor:grabbing}
        .peer-selector{padding-top:4px!important;padding-bottom:4px!important}.peer{height:44px!important;min-height:44px}
        .row{min-width:0}.row>span{min-width:0}.row>strong{min-width:0;max-width:62%;overflow-wrap:anywhere;word-break:break-word}
        .u154-mode strong{white-space:nowrap!important;overflow-wrap:normal!important;word-break:normal!important}
        .u154-metric span,.u154-status span,.u154-note,.u155-control-top small,.u136-control .u136-set span,.u136-control .u136-flap small,.u136-control .u136-feature small,.u144-pending,.u144-log,.history155 text{font-size:12px!important}
        .header-action#refresh{transition:transform .12s ease,color .18s ease,background .18s ease}
        .header-action#refresh:active{transform:scale(.90)}
        .header-action#refresh.refreshing ha-icon{animation:spin .75s linear infinite!important}
        .header-action#refresh.refresh-ok{color:#43a047;background:color-mix(in srgb,#43a047 12%,var(--card-background-color))}
        .header-action#refresh.refresh-error{color:#e53935;background:color-mix(in srgb,#e53935 10%,var(--card-background-color))}
        .u158-refresh-status,.u158-zoom-status{position:absolute;z-index:20;left:50%;transform:translateX(-50%) translateY(-6px);max-width:calc(100% - 24px);padding:8px 12px;border-radius:13px;background:var(--card-background-color);box-shadow:0 7px 22px rgba(23,45,76,.18);font-size:12px;font-weight:700;line-height:1.25;text-align:center;opacity:0;pointer-events:none;transition:opacity .16s ease,transform .16s ease}
        .u158-refresh-status{top:calc(118px + env(safe-area-inset-top));color:#e53935;border:1px solid color-mix(in srgb,#e53935 34%,var(--divider-color))}
        .u158-zoom-status{bottom:calc(72px + env(safe-area-inset-bottom));color:var(--primary-text-color);border:1px solid var(--divider-color)}
        .u158-refresh-status[data-show="1"],.u158-zoom-status[data-show="1"]{opacity:1;transform:translateX(-50%) translateY(0)}
        @media(min-width:600px){.content{padding:16px 16px calc(42px + env(safe-area-inset-bottom))!important}}
        @media(min-width:1024px){.content{padding:24px 24px calc(50px + env(safe-area-inset-bottom))!important}}
      `;
      root.append(style);
    }
    if (!root.querySelector(".u158-refresh-status")) {
      const status = document.createElement("div");
      status.className = "u158-refresh-status";
      status.setAttribute("role", "alert");
      status.setAttribute("aria-live", "assertive");
      root.querySelector(".shell")?.append(status);
    }
    if (!root.querySelector(".u158-zoom-status")) {
      const status = document.createElement("div");
      status.className = "u158-zoom-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      root.querySelector(".shell")?.append(status);
    }
    if (root.lastElementChild !== style) root.append(style);
    const version = root.querySelector(".header-title span");
    if (version) version.textContent = `UI v${UI158}`;
    const refresh = root.getElementById("refresh");
    if (refresh) {
      const state = this._refreshState158;
      refresh.classList.toggle("refresh-ok", state === "ok");
      refresh.classList.toggle("refresh-error", state === "error");
      refresh.setAttribute("aria-busy", state === "working" ? "true" : "false");
      refresh.setAttribute("aria-label", this._refreshMessage158 || "Обновить состояние кондиционера");
      refresh.title = this._refreshMessage158 || "Обновить";
      const icon = refresh.querySelector("ha-icon");
      if (icon) icon.setAttribute(
        "icon",
        state === "ok" ? "mdi:check" : state === "error" ? "mdi:alert-circle-outline" : "mdi:refresh",
      );
    }
    const refreshStatus = root.querySelector(".u158-refresh-status");
    if (refreshStatus) {
      refreshStatus.textContent = this._refreshState158 === "error" ? this._refreshMessage158 : "";
      refreshStatus.dataset.show = this._refreshState158 === "error" ? "1" : "0";
    }
    this.__installZoom158();
    frame158(() => this.__applyTransform158());
  };

  Panel.prototype.render = function(...args) {
    const result = previousRender.apply(this, args);
    this.__installUi158();
    return result;
  };

  Panel.prototype.patch = function(...args) {
    if (this._u158GestureActive) {
      this._u158PatchQueued = true;
      return undefined;
    }
    const root = this.shadowRoot;
    const devices = root?.getElementById?.("devices");
    const content = root?.getElementById?.("content");
    const oldDevices = devices ? [...devices.children] : [];
    const oldContent = content?.firstElementChild || null;
    const oldView = this.__domView158;
    const nextView = `${this._selected || "living"}:${this._tab || "summary"}`;
    const active = root?.activeElement || null;
    const viewport = root?.querySelector?.(".viewport");
    const scrollTop = viewport?.scrollTop || 0;
    const scrollLeft = viewport?.scrollLeft || 0;
    const result = previousPatch.apply(this, args);

    if (devices && oldDevices.length === devices.children.length) {
      const freshDevices = [...devices.children];
      const retained = oldDevices.map((node, index) => morph158(node, freshDevices[index]));
      devices.replaceChildren(...retained);
    }
    if (content && oldContent && oldView === nextView && content.firstElementChild) {
      const retained = morph158(oldContent, content.firstElementChild);
      content.replaceChildren(retained);
    }
    if (viewport && oldView === nextView) {
      viewport.scrollTop = scrollTop;
      viewport.scrollLeft = scrollLeft;
    }
    if (active?.isConnected && typeof active.focus === "function") {
      try { active.focus({preventScroll: true}); } catch (_error) { active.focus(); }
    }
    this.__domView158 = nextView;
    this.__installUi158();
    if (oldView && oldView !== nextView) this.__loadViewTransform158({resetScroll: true});
    if (this._tab === "statistics") this.mountStatistics154?.();
    return result;
  };

  Panel.prototype.__ui158 = true;
}
