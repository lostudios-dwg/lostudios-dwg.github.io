(async () => {
  const grid = document.querySelector("[data-render-grid]");
  const status = document.querySelector("[data-render-status]");
  if (!grid) return;

  const localSource = document.body.classList.contains("uniform-test");
  let source = document;
  if (!localSource) {
    const response = await fetch("render.html?v=render-cover-season-2");
    if (!response.ok) throw new Error(`Unable to load render index: ${response.status}`);
    source = new DOMParser().parseFromString(await response.text(), "text/html");
  }
  const sourceItems = [...source.querySelectorAll(localSource ? ".uniform-source-item" : ".render-space-gallery .render-photo")];

  const atmosphere = document.createElement("div");
  atmosphere.className = "render-atmosphere";
  atmosphere.setAttribute("aria-hidden", "true");
  document.body.prepend(atmosphere);
  const ambientLayers = new Map();
  let ambientRequest = 0;
  let leaveTimer;
  const clearAtmosphere = () => {
    ambientRequest += 1;
    atmosphere.classList.remove("is-active");
    ambientLayers.forEach((layer) => layer.classList.remove("is-active"));
  };
  const showAtmosphere = async (item) => {
    clearTimeout(leaveTimer);
    const request = ++ambientRequest;
    const image = item.querySelector(".visual-stack-layer--front") || item.querySelector("img");
    if (!image) return;
    const src = image.currentSrc || image.src;
    let layer = ambientLayers.get(src);
    if (!layer) {
      layer = new Image();
      layer.className = "render-atmosphere-layer";
      layer.alt = "";
      layer.src = src;
      ambientLayers.set(src, layer);
      atmosphere.append(layer);
    }
    try { await layer.decode(); } catch { return; }
    if (request !== ambientRequest) return;
    atmosphere.classList.add("is-active");
    ambientLayers.forEach((candidate) => candidate.classList.toggle("is-active", candidate === layer));
  };
  const leaveAtmosphere = () => {
    clearTimeout(leaveTimer);
    ambientRequest += 1;
    leaveTimer = setTimeout(clearAtmosphere, 180);
  };


  const getKind = (item) => {
    const title = item.dataset.title || "";
    if (/Studio RAI|Barcelona Pavilion/i.test(title)) return "interior exterior";
    if (/exterior|waterfront arrival|residential module/i.test(title)) return "exterior";
    return "interior";
  };
  const getProductionLabel = (item) => {
    const name = item.dataset.title || "";
    if (/Present Absence/.test(name)) return "Spring 2026";
    if (/Floating Community/.test(name)) return "Spring 2025";
    if (/Library L|City Pop/.test(name)) return "Fall 2024";
    if (/Studio RAI/.test(name)) return "Summer 2024";
    if (/Barcelona Pavilion/.test(name)) return "Summer 2024";
    if (/Advanced Rendering/.test(name)) return "Spring 2024";
    if (/The Lo Chair/.test(name)) return "Summer 2025";
    if (/Ying-Li/.test(name)) return "Winter 2026";
    if (/DeCicco/.test(name)) return "Summer 2024";
    if (/Neon|Natural Building|Revit Work Samples/.test(name)) return "Spring 2025";
    if (/INT-713/.test(name)) return "Fall 2024";
    if (/Changing Ties|The Bind|Assembling Atmospheres|Student Union/.test(name)) return "Spring 2024";
    return "";
  };

  sourceItems.forEach((sourceItem) => {
    const item = sourceItem.cloneNode(true);
    const isStack = item.classList.contains("visual-gallery-stack");
    item.className = `visual-gallery-item render-photo editorial-render-card${isStack ? " visual-gallery-stack" : ""}`;
    item.dataset.kind = item.dataset.kind || getKind(item);
    item.style.removeProperty("width");
    item.classList.remove("uniform-source-item");
    item.querySelector(".visual-stack-count")?.remove();
    const caption = document.createElement("span");
    caption.className = "render-stack-label";
    const name = document.createElement("span");
    name.textContent = item.dataset.title || "";
    const date = document.createElement("span");
    date.className = "render-stack-date";
    date.textContent = getProductionLabel(item);
    item.dataset.productionLabel = date.textContent;
    caption.append(name, date);
    item.append(caption);

    if (localSource) sourceItem.replaceWith(item);
    else grid.append(item);
    item.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch") showAtmosphere(item);
    });
    item.addEventListener("pointerleave", () => {
      if (!item.contains(document.activeElement)) leaveAtmosphere();
    });
    item.addEventListener("focusin", () => showAtmosphere(item));
    item.addEventListener("focusout", leaveAtmosphere);
    const front = item.querySelector(".visual-stack-layer--front");
    if (front) {
      const fitStack = () => {
        if (front.naturalWidth && front.naturalHeight) {
          front.parentElement.style.aspectRatio = `${front.naturalWidth} / ${front.naturalHeight}`;
        }
      };
      front.addEventListener("load", fitStack, { once: true });
      fitStack();
    }
  });

  if (!localSource) source.querySelectorAll("template[id^='render-']").forEach((template) => {
    grid.after(template.cloneNode(true));
  });

  const filterButtons = [...document.querySelectorAll("[data-render-filter]")];

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      clearTimeout(leaveTimer);
      clearAtmosphere();
      const filter = button.dataset.renderFilter;
      filterButtons.forEach((control) => {
        const active = control === button;
        control.classList.toggle("is-active", active);
        control.setAttribute("aria-pressed", String(active));
      });
      let visible = 0;
      grid.querySelectorAll(".editorial-render-card").forEach((item) => {
        item.hidden = filter !== "all" && !item.dataset.kind.split(" ").includes(filter);
        if (!item.hidden) visible += 1;
      });
      if (status) status.textContent = `${visible} render groups shown.`;
    });
  });


  if (status) status.textContent = `${sourceItems.length} render groups shown.`;
  document.body.classList.remove("editorial-loading");

  const siteScript = document.createElement("script");
  siteScript.src = "assets/js/render-site.js?v=render-only-1";
  document.body.append(siteScript);
})().catch((error) => {
  console.error(error);
  const status = document.querySelector("[data-render-status]");
  if (status) status.textContent = "The render index could not be loaded.";
  document.body.classList.remove("editorial-loading");
});
