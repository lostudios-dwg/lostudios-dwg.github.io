(async () => {
  const main = document.querySelector("main");
  if (!main) return;
  const heading = main.querySelector("h1")?.textContent || "WORK";
  const cards = [...main.querySelectorAll(".project-card, .visual-gallery-item")];
  const existingTemplates = [...main.querySelectorAll("template")];
  const templateResponse = await fetch("render-layout-test.html?v=work-unified-2");
  if (!templateResponse.ok) throw new Error("Unable to load gallery layout");
  const layout = new DOMParser().parseFromString(await templateResponse.text(), "text/html");
  const nextMain = layout.querySelector("main").cloneNode(true);
  nextMain.querySelector("h1").textContent = heading;
  nextMain.style.setProperty("--directory-title-size", `${Math.min(13, 140 / heading.length)}vw`);
  nextMain.querySelector("h1").id = "work-gallery-title";
  nextMain.querySelector("section").setAttribute("aria-labelledby", "work-gallery-title");
  const grid = nextMain.querySelector("[data-render-grid]");
  const filters = nextMain.querySelector(".editorial-render-filters");
  filters.replaceChildren();
  const groups = new Set();
  const prepared = await Promise.all(cards.map(async (card, index) => {
    if (!card.classList.contains("project-card")) {
      const item = card.cloneNode(true);
      item.classList.add("uniform-source-item");
      return item;
    }
    const project = card.getAttribute("href");
    const title = card.querySelector("h2,h3")?.textContent || "Project";
    const group = card.closest(".directory-section")?.querySelector(".directory-section-heading h2")?.textContent || "Projects";
    groups.add(group);
    const images = [card.querySelector("img")];
    try {
      const response = await fetch(project);
      if (response.ok) {
        const page = new DOMParser().parseFromString(await response.text(), "text/html");
        images.push(...page.querySelectorAll(".project-gallery-item img"));
      }
    } catch { /* Keep the directory image available if the preview cannot load. */ }
    const unique = [...new Map(images.filter(Boolean).map(image => [image.getAttribute("src").split("?")[0], image])).values()].slice(0, 5);
    const item = document.createElement("button");
    item.type = "button";
    item.className = "visual-gallery-item visual-gallery-stack uniform-source-item";
    item.dataset.title = title;
    item.dataset.project = project;
    item.dataset.kind = group.toLowerCase().replace(/\s+/g, "-");
    item.dataset.stack = `directory-preview-${index}`;
    item.setAttribute("aria-label", `Open ${title} gallery`);
    const stack = document.createElement("span");
    stack.className = "visual-stack-preview";
    const layers = unique.length > 2 ? [[2,"back"],[1,"middle"],[0,"front"]] : unique.length > 1 ? [[1,"back"],[0,"front"]] : [[0,"front"]];
    layers.forEach(([position, name]) => {
      const image = unique[position].cloneNode(true);
      image.className = `visual-stack-layer visual-stack-layer--${name}`;
      image.loading = "lazy";
      if (name !== "front") { image.alt = ""; image.setAttribute("aria-hidden", "true"); }
      stack.append(image);
    });
    item.append(stack);
    const template = document.createElement("template");
    template.id = item.dataset.stack;
    unique.forEach(image => {
      const entry = document.createElement("span");
      entry.dataset.full = image.getAttribute("src");
      entry.dataset.alt = image.alt;
      template.content.append(entry);
    });
    nextMain.append(template);
    return item;
  }));
  const isRender = location.pathname.endsWith("/render.html");
  const filterLabels = isRender ? ["All", "Interior", "Exterior"] : ["All", ...(groups.size > 1 ? groups : [])];
  filterLabels.forEach((label, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.renderFilter = label.toLowerCase().replace(/\s+/g, "-");
    button.setAttribute("aria-pressed", String(index === 0));
    if (!index) button.className = "is-active";
    filters.append(button);
  });
  grid.append(...prepared);
  existingTemplates.forEach(template => nextMain.append(template.cloneNode(true)));
  main.replaceWith(nextMain);
  document.body.classList.add("uniform-test", "render-editorial-test", "visual-gallery-page");
  const load = document.createElement("script");
  load.src = "assets/js/render-editorial-test.js?v=work-unified-3";
  document.body.append(load);
})().catch(error => {
  console.error(error);
  const fallback = document.createElement("script");
  fallback.src = "assets/js/script.js?v=work-unified-2";
  document.body.append(fallback);
});
