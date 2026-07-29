const menuButton = document.querySelector(".menu-button");

const revealPage = () => {
  document.body.classList.remove("page-leaving");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => document.body.classList.add("page-ready"));
  });
};

revealPage();
window.addEventListener("pageshow", revealPage);

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link || event.defaultPrevented) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
  if (link.target === "_blank" || link.hasAttribute("download")) return;

  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;

  event.preventDefault();
  document.body.classList.remove("page-ready");
  document.body.classList.add("page-leaving");
  window.setTimeout(() => {
    window.location.href = destination.href;
  }, 620);
});

if (menuButton) {
  menuButton.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("menu-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });
}

const workCategories = document.querySelectorAll(".category");

if (workCategories.length) {
  if ("IntersectionObserver" in window) {
    const categoryObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = [...workCategories].indexOf(entry.target);
        entry.target.style.transitionDelay = `${index * 90}ms`;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18 });

    workCategories.forEach((category) => categoryObserver.observe(category));
  } else {
    workCategories.forEach((category) => category.classList.add("is-visible"));
  }
}

const imageCycles = document.querySelectorAll(".image-cycle");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

imageCycles.forEach((cycle, cycleIndex) => {
  const frames = [...cycle.querySelectorAll(".cycle-frame")];
  if (frames.length < 2) return;

  let activeIndex = Math.max(0, frames.findIndex((frame) => frame.classList.contains("is-active")));
  frames.forEach((frame, index) => frame.setAttribute("aria-hidden", String(index !== activeIndex)));
  if (prefersReducedMotion) return;

  const showNextFrame = () => {
    frames[activeIndex].classList.remove("is-active");
    frames[activeIndex].setAttribute("aria-hidden", "true");
    activeIndex = (activeIndex + 1) % frames.length;
    frames[activeIndex].classList.add("is-active");
    frames[activeIndex].setAttribute("aria-hidden", "false");
  };

  window.setTimeout(() => {
    showNextFrame();
    window.setInterval(showNextFrame, 3900);
  }, 2800 + cycleIndex * 650);
});

const projectGallery = document.querySelector(".project-gallery");

if (projectGallery) {
  const galleryImages = [...projectGallery.querySelectorAll(".project-gallery-item img")];
  const lightboxImages = galleryImages.slice(1);

  if (lightboxImages.length) {
    const previewFigure = lightboxImages[0].closest(".project-gallery-item");
    previewFigure.classList.add("project-preview-main");
    galleryImages.slice(2).forEach((image) => {
      image.closest(".project-gallery-item").classList.add("is-gallery-hidden");
    });
    const moreButton = document.createElement("button");
    moreButton.className = "project-more";
    moreButton.type = "button";
    moreButton.setAttribute("aria-label", "Open the complete project gallery");
    moreButton.textContent = "more...";
    previewFigure.appendChild(moreButton);

    const previewReel = document.createElement("div");
    previewReel.className = "project-preview-reel";
    previewReel.setAttribute("aria-label", "More images from this project");
    lightboxImages.slice(1).forEach((image, index) => {
      const reelButton = document.createElement("button");
      reelButton.className = "project-preview-thumb";
      reelButton.type = "button";
      reelButton.setAttribute("aria-label", `Open project image ${index + 2}`);
      reelButton.innerHTML = `
        <img src="${image.currentSrc || image.src}" alt="" loading="lazy">
        <span class="project-preview-number" aria-hidden="true">${index + 2}</span>
      `;
      const reelImage = reelButton.querySelector("img");
      const setReelRatio = () => {
        if (reelImage.naturalWidth && reelImage.naturalHeight) {
          reelButton.style.aspectRatio = `${reelImage.naturalWidth} / ${reelImage.naturalHeight}`;
        }
      };
      if (reelImage.complete) setReelRatio();
      else reelImage.addEventListener("load", setReelRatio, { once: true });
      reelButton.addEventListener("click", () => openLightbox(index + 1));
      previewReel.appendChild(reelButton);
    });
    const projectBrowser = document.createElement("div");
    projectBrowser.className = "project-browser";
    galleryImages[0].closest(".project-gallery-item").after(projectBrowser);
    projectBrowser.append(previewFigure, previewReel);

    const lightbox = document.createElement("dialog");
    lightbox.className = "lightbox";
    lightbox.setAttribute("aria-label", "Fullscreen project image");
    lightbox.innerHTML = `
      <button class="lightbox-close" type="button" aria-label="Close fullscreen image">&times;</button>
      <div class="lightbox-tools" aria-label="Image zoom controls">
        <button class="lightbox-zoom-out" type="button" aria-label="Zoom out">&minus;</button>
        <span class="lightbox-zoom-level" aria-live="polite">100%</span>
        <button class="lightbox-zoom-in" type="button" aria-label="Zoom in">&plus;</button>
        <button class="lightbox-zoom-reset" type="button">Reset</button>
      </div>
      <button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous image">&larr;</button>
      <div class="lightbox-stage">
        <div class="lightbox-image-wrap"><img src="" alt=""></div>
        <p class="lightbox-count" aria-live="polite"></p>
        <p class="lightbox-caption"></p>
      </div>
      <button class="lightbox-nav lightbox-next" type="button" aria-label="Next image">&rarr;</button>
    `;
    document.body.appendChild(lightbox);

    const fullImage = lightbox.querySelector(".lightbox-stage img");
    const count = lightbox.querySelector(".lightbox-count");
    const lightboxCaption = lightbox.querySelector(".lightbox-caption");
    const zoomLevel = lightbox.querySelector(".lightbox-zoom-level");
    const stage = lightbox.querySelector(".lightbox-stage");
    let currentIndex = 0;
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOriginX = 0;
    let dragOriginY = 0;
    let pointerMoved = false;
    let panFrame = 0;
    let imageTransitionTimer = 0;

    const clampPan = () => {
      if (zoom === 1) {
        panX = 0;
        panY = 0;
        return;
      }
      const maxX = Math.max(0, (fullImage.clientWidth * zoom - stage.clientWidth) / 2);
      const maxY = Math.max(0, (fullImage.clientHeight * zoom - stage.clientHeight) / 2);
      panX = Math.max(-maxX, Math.min(maxX, panX));
      panY = Math.max(-maxY, Math.min(maxY, panY));
    };

    const renderTransform = () => {
      cancelAnimationFrame(panFrame);
      panFrame = requestAnimationFrame(() => {
        fullImage.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
      });
    };

    const setZoom = (nextZoom) => {
      zoom = Math.min(4, Math.max(1, nextZoom));
      clampPan();
      renderTransform();
      fullImage.classList.toggle("is-zoomed", zoom > 1);
      zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
      if (zoom === 1) {
        panX = 0;
        panY = 0;
        renderTransform();
      }
    };

    const showImage = (index) => {
      currentIndex = (index + lightboxImages.length) % lightboxImages.length;
      const source = lightboxImages[currentIndex];
      setZoom(1);
      count.textContent = `${currentIndex + 1} / ${lightboxImages.length}`;
      lightboxCaption.textContent = source.dataset.caption || "";
      lightboxCaption.hidden = !source.dataset.caption;
      fullImage.classList.add("is-changing");
      clearTimeout(imageTransitionTimer);
      imageTransitionTimer = window.setTimeout(() => {
        fullImage.src = source.currentSrc || source.src;
        fullImage.alt = source.alt;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => fullImage.classList.remove("is-changing"));
        });
      }, lightbox.open ? 420 : 0);
    };

    const openLightbox = (index) => {
      showImage(index);
      lightbox.showModal();
      document.body.classList.add("lightbox-open");
    };

    const closeLightbox = () => {
      lightbox.close();
      document.body.classList.remove("lightbox-open");
    };

    lightboxImages.forEach((image, index) => {
      image.classList.add("lightbox-trigger");
      image.setAttribute("tabindex", "0");
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", `${image.alt}. Open fullscreen image`);
      image.addEventListener("click", () => openLightbox(index));
      image.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLightbox(index);
        }
      });
    });

    moreButton.addEventListener("click", () => openLightbox(0));

    lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    lightbox.querySelector(".lightbox-prev").addEventListener("click", () => showImage(currentIndex - 1));
    lightbox.querySelector(".lightbox-next").addEventListener("click", () => showImage(currentIndex + 1));
    lightbox.querySelector(".lightbox-zoom-in").addEventListener("click", () => setZoom(zoom + .5));
    lightbox.querySelector(".lightbox-zoom-out").addEventListener("click", () => setZoom(zoom - .5));
    lightbox.querySelector(".lightbox-zoom-reset").addEventListener("click", () => setZoom(1));

    fullImage.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragOriginX = panX;
      dragOriginY = panY;
      pointerMoved = false;
      fullImage.setPointerCapture(event.pointerId);
      fullImage.classList.add("is-panning");
    });

    fullImage.addEventListener("pointermove", (event) => {
      if (!fullImage.hasPointerCapture(event.pointerId)) return;
      const deltaX = event.clientX - dragStartX;
      const deltaY = event.clientY - dragStartY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 5) pointerMoved = true;
      if (zoom === 1) return;
      panX = dragOriginX + deltaX;
      panY = dragOriginY + deltaY;
      clampPan();
      renderTransform();
    });

    const finishPan = (event) => {
      if (!fullImage.hasPointerCapture(event.pointerId)) return;
      const swipeX = event.clientX - dragStartX;
      const swipeY = event.clientY - dragStartY;
      fullImage.releasePointerCapture(event.pointerId);
      fullImage.classList.remove("is-panning");
      if (zoom === 1 && pointerMoved && Math.abs(swipeX) > 55 && Math.abs(swipeX) > Math.abs(swipeY) * 1.25) {
        showImage(currentIndex + (swipeX < 0 ? 1 : -1));
        return;
      }
      if (!pointerMoved) setZoom(zoom === 1 ? 2 : 1);
    };

    fullImage.addEventListener("pointerup", finishPan);
    fullImage.addEventListener("pointercancel", (event) => {
      if (fullImage.hasPointerCapture(event.pointerId)) {
        fullImage.releasePointerCapture(event.pointerId);
      }
      fullImage.classList.remove("is-panning");
    });

    stage.addEventListener("wheel", (event) => {
      if (!lightbox.open) return;
      event.preventDefault();
      setZoom(zoom + (event.deltaY < 0 ? .25 : -.25));
    }, { passive: false });
    lightbox.querySelector(".lightbox-stage").addEventListener("click", (event) => {
      if (event.target.classList.contains("lightbox-stage")) closeLightbox();
    });
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    lightbox.addEventListener("close", () => document.body.classList.remove("lightbox-open"));
    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") showImage(currentIndex - 1);
      if (event.key === "ArrowRight") showImage(currentIndex + 1);
      if (event.key === "+" || event.key === "=") setZoom(zoom + .5);
      if (event.key === "-") setZoom(zoom - .5);
      if (event.key === "0") setZoom(1);
    });

    window.addEventListener("resize", () => {
      clampPan();
      renderTransform();
    });
  }
}
