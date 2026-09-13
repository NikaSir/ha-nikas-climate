const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const frontend = path.resolve(__dirname, "../custom_components/nikas_climate/frontend");

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 2048, height: 1093 } });
    await page.route("http://panel.test/**", (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === "/") {
        return route.fulfill({
          contentType: "text/html",
          body: `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
            <style>
              html,body{width:100%;height:100%;margin:0}
              .ha-sidebar{position:fixed;inset:0 auto 0 0;width:371px}
              .ha-panel-host{position:fixed;inset:0 0 0 371px;overflow:hidden}
            </style>
            <aside class="ha-sidebar"></aside>
            <main class="ha-panel-host"><nikas-climate-panel></nikas-climate-panel></main>
            <script type="module" src="/nikas_climate_panel/nikas-climate-production.js"></script>`,
        });
      }
      const file = path.join(frontend, pathname.replace("/nikas_climate_panel/", ""));
      return fs.existsSync(file)
        ? route.fulfill({ path: file })
        : route.fulfill({ status: 404, body: "" });
    });

    await page.goto("http://panel.test/");
    await page.waitForFunction(() => customElements.get("nikas-climate-panel"));
    await page.evaluate(() => {
      const panel = document.querySelector("nikas-climate-panel");
      panel._entityRegistry = [];
      panel._areaRegistry = [];
      panel._labelRegistry = [];
      panel.ensureRegistries = async () => {};
      panel.ensureHistory = async () => {};
      panel.hass = {
        states: {
          "climate.living": {
            entity_id: "climate.living",
            state: "off",
            attributes: { friendly_name: "Кондиционер в зале", temperature: 23, current_temperature: 27 },
          },
          "sensor.sensor_th_zb_11_temperature": {
            entity_id: "sensor.sensor_th_zb_11_temperature",
            state: "23.8",
            attributes: { device_class: "temperature" },
          },
        },
        callService: async () => {},
        callWS: async () => [],
        callApi: async () => [],
      };
    });
    await page.waitForFunction(() => document.querySelector("nikas-climate-panel")?.shadowRoot?.querySelector(".shell"));

    const readGeometry = () => page.evaluate(() => {
      const panel = document.querySelector("nikas-climate-panel");
      const host = document.querySelector(".ha-panel-host");
      const root = panel.shadowRoot;
      const rect = (element) => {
        const box = element.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
      };
      return {
        host: rect(host),
        panel: rect(panel),
        shell: rect(root.querySelector(".shell")),
        header: rect(root.querySelector(".app-header")),
        bottomNav: rect(root.querySelector(".bottom-nav")),
        content: rect(root.querySelector(".content")),
      };
    });

    const verify = (geometry, label) => {
      assert.deepEqual(geometry.panel, geometry.host, `${label}: panel must use the Home Assistant content box`);
      assert.deepEqual(geometry.shell, geometry.host, `${label}: shell must stay inside the Home Assistant content box`);
      assert.equal(geometry.header.left, geometry.host.left, `${label}: header must not sit under HA sidebar`);
      assert.equal(geometry.bottomNav.left, geometry.host.left, `${label}: bottom navigation must not sit under HA sidebar`);
      const contentWidth = Math.min(geometry.host.width, 1280);
      const contentLeft = geometry.host.left + (geometry.host.width - contentWidth) / 2;
      assert.equal(geometry.content.width, contentWidth, `${label}: content must respect its 1280 px maximum`);
      assert.equal(geometry.content.left, contentLeft, `${label}: content must be centered in the HA host`);
    };

    const expanded = await readGeometry();
    verify(expanded, "Expanded sidebar");
    assert.equal(expanded.host.left, 371, "Desktop fixture must retain the measured 371 px sidebar");

    await page.evaluate(() => { document.querySelector(".ha-panel-host").style.left = "0"; });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    const collapsed = await readGeometry();
    verify(collapsed, "Collapsed sidebar");
    assert.equal(collapsed.host.left, 0, "Collapsed sidebar must release the complete browser width");

    console.log("PASS Climate desktop HA host boundary with expanded and collapsed sidebars");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
