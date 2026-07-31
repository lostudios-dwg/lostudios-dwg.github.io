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
  try { sessionStorage.setItem("contact-intro-seen", "true"); } catch (error) { /* Storage may be unavailable. */ }
  document.body.classList.remove("page-ready");
  document.body.classList.add("page-leaving");
  window.setTimeout(() => {
    window.location.href = destination.href;
  }, 520);
});

if (menuButton) {
  menuButton.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("menu-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });
}

const homePanels = document.querySelectorAll(".home-page .home-hero, .home-page .home-about, .home-page .home-work");

if (homePanels.length) {
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const panelObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in-view");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -5%" });
    homePanels.forEach((panel) => panelObserver.observe(panel));
  } else {
    homePanels.forEach((panel) => panel.classList.add("is-in-view"));
  }
}

const contactDrawer = document.querySelector("body:not(.contact-page) .site-footer");
let setContactDrawerOpen = null;
let contactDrawerCollapsedByScroll = false;

if (contactDrawer) {
  const drawerToggle = document.createElement("button");
  drawerToggle.className = "footer-toggle";
  drawerToggle.type = "button";
  drawerToggle.textContent = "Contact";
  drawerToggle.setAttribute("aria-expanded", "false");
  drawerToggle.setAttribute("aria-label", "Show contact information");
  contactDrawer.prepend(drawerToggle);

  setContactDrawerOpen = (isOpen) => {
    contactDrawer.classList.toggle("is-open", isOpen);
    drawerToggle.setAttribute("aria-expanded", String(isOpen));
    drawerToggle.setAttribute("aria-label", `${isOpen ? "Hide" : "Show"} contact information`);
  };

  let shouldIntroduceContact = document.body.classList.contains("home-page");
  try { shouldIntroduceContact = shouldIntroduceContact && sessionStorage.getItem("contact-intro-seen") !== "true"; } catch (error) { /* Use page default. */ }
  setContactDrawerOpen(shouldIntroduceContact);

  drawerToggle.addEventListener("click", () => {
    setContactDrawerOpen(!contactDrawer.classList.contains("is-open"));
  });
  document.addEventListener("click", (event) => {
    if (contactDrawer.contains(event.target)) return;
    setContactDrawerOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setContactDrawerOpen(false);
  });
  window.addEventListener("scroll", () => {
    if (contactDrawerCollapsedByScroll || window.scrollY < 48) return;
    contactDrawerCollapsedByScroll = true;
    try { sessionStorage.setItem("contact-intro-seen", "true"); } catch (error) { /* Storage may be unavailable. */ }
    if (!document.body.classList.contains("category-description-active")) {
      setContactDrawerOpen(false);
    }
  }, { passive: true });
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

  const descriptionPanel = document.querySelector(".work-description-panel");
  const descriptionLabel = descriptionPanel?.querySelector(".work-description-label");
  const descriptionCopy = descriptionPanel?.querySelector(".work-description-copy");

  const supportsCategoryHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (descriptionPanel && descriptionLabel && descriptionCopy) {
    let activeCategory = null;
    let hideDescriptionTimer = null;
    let switchDescriptionTimer = null;
    let contactReleaseTimer = null;

    const updateDescription = (category) => {
      descriptionLabel.textContent = category.dataset.category || "";
      descriptionCopy.textContent = category.dataset.description || "";
      activeCategory = category;
    };

    const showCategoryDescription = (category) => {
      window.clearTimeout(hideDescriptionTimer);
      window.clearTimeout(switchDescriptionTimer);
      window.clearTimeout(contactReleaseTimer);

      if (descriptionPanel.classList.contains("is-active") && activeCategory !== category) {
        descriptionPanel.classList.add("is-switching");
        switchDescriptionTimer = window.setTimeout(() => {
          updateDescription(category);
          requestAnimationFrame(() => descriptionPanel.classList.remove("is-switching"));
        }, 200);
      } else if (!activeCategory) {
        updateDescription(category);
      }

      descriptionPanel.classList.add("is-active");
      descriptionPanel.setAttribute("aria-hidden", "false");
      document.body.classList.add("category-description-active");

      if (setContactDrawerOpen) setContactDrawerOpen(true);
    };

    const hideCategoryDescription = () => {
      window.clearTimeout(hideDescriptionTimer);
      hideDescriptionTimer = window.setTimeout(() => {
        window.clearTimeout(switchDescriptionTimer);
        descriptionPanel.classList.remove("is-active", "is-switching");
        descriptionPanel.setAttribute("aria-hidden", "true");
        activeCategory = null;
        contactReleaseTimer = window.setTimeout(() => {
          document.body.classList.remove("category-description-active");
          if (contactDrawerCollapsedByScroll && setContactDrawerOpen) setContactDrawerOpen(false);
        }, 700);
      }, 220);
    };

    if (supportsCategoryHover) {
      workCategories.forEach((category) => {
        category.addEventListener("mouseenter", () => showCategoryDescription(category));
        category.addEventListener("mouseleave", () => {
          if (document.activeElement !== category) hideCategoryDescription();
        });
        category.addEventListener("focus", () => showCategoryDescription(category));
        category.addEventListener("blur", hideCategoryDescription);
      });
    } else {
      let mobileDescriptionFrame = 0;
      const updateMobileDescription = () => {
        if (window.scrollY < 48) return;
        const readingLine = window.innerHeight * .48;
        const visibleCategories = [...workCategories].filter((category) => {
          const bounds = category.getBoundingClientRect();
          return bounds.bottom > window.innerHeight * .18 && bounds.top < window.innerHeight * .78;
        });
        if (!visibleCategories.length) {
          hideCategoryDescription();
          return;
        }
        const nearestCategory = visibleCategories.reduce((nearest, category) => {
          const center = category.getBoundingClientRect().top + category.offsetHeight / 2;
          const nearestCenter = nearest.getBoundingClientRect().top + nearest.offsetHeight / 2;
          return Math.abs(center - readingLine) < Math.abs(nearestCenter - readingLine) ? category : nearest;
        });
        showCategoryDescription(nearestCategory);
      };
      window.addEventListener("scroll", () => {
        cancelAnimationFrame(mobileDescriptionFrame);
        mobileDescriptionFrame = requestAnimationFrame(updateMobileDescription);
      }, { passive: true });
      window.addEventListener("pageshow", updateMobileDescription);
    }
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

const projectGalleries = [...document.querySelectorAll(".project-gallery")];

projectGalleries.forEach((projectGallery) => {
  const galleryImages = [...projectGallery.querySelectorAll(".project-gallery-item img")];
  const isStageGallery = projectGallery.classList.contains("project-gallery--stage");
  const isModelStudy = Boolean(projectGallery.closest(".model-study"));
  const lightboxImages = isStageGallery ? galleryImages : galleryImages.slice(1);

  if (lightboxImages.length) {
    const previewFigure = lightboxImages[0].closest(".project-gallery-item");
    previewFigure.classList.add("project-preview-main");
    lightboxImages.slice(1).forEach((image) => {
      image.closest(".project-gallery-item").classList.add("is-gallery-hidden");
    });
    const moreButton = document.createElement("button");
    moreButton.className = `project-more${isModelStudy ? " project-more--wordless" : ""}`;
    moreButton.type = "button";
    moreButton.setAttribute("aria-label", "Open the complete project gallery");
    moreButton.textContent = isModelStudy ? "" : "more...";
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
    if (isStageGallery) projectGallery.appendChild(projectBrowser);
    else galleryImages[0].closest(".project-gallery-item").after(projectBrowser);
    projectBrowser.append(previewFigure, previewReel);

    const previewThumbs = [...previewReel.querySelectorAll(".project-preview-thumb")];
    if (previewThumbs.length && window.matchMedia("(hover: none), (pointer: coarse)").matches) {
      projectBrowser.classList.add("is-mobile-browsing");
      let reelFrame = 0;
      const updateActivePreview = () => {
        const reelBounds = previewReel.getBoundingClientRect();
        const reelCenter = reelBounds.left + reelBounds.width / 2;
        const nearestThumb = previewThumbs.reduce((nearest, thumb) => {
          const center = thumb.getBoundingClientRect().left + thumb.offsetWidth / 2;
          const nearestCenter = nearest.getBoundingClientRect().left + nearest.offsetWidth / 2;
          return Math.abs(center - reelCenter) < Math.abs(nearestCenter - reelCenter) ? thumb : nearest;
        });
        previewThumbs.forEach((thumb) => thumb.classList.toggle("is-mobile-active", thumb === nearestThumb));
      };
      updateActivePreview();
      previewReel.addEventListener("scroll", () => {
        cancelAnimationFrame(reelFrame);
        reelFrame = requestAnimationFrame(updateActivePreview);
      }, { passive: true });
      window.addEventListener("resize", updateActivePreview);
    }

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
      <p class="lightbox-gesture-hint">Pinch to zoom · drag to move</p>
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
    const activePointers = new Map();
    let pinchStartDistance = 0;
    let pinchStartZoom = 1;
    let pinchStartPanX = 0;
    let pinchStartPanY = 0;
    let pinchStartCenterX = 0;
    let pinchStartCenterY = 0;

    const getPinchGeometry = () => {
      const pointers = [...activePointers.values()];
      if (pointers.length < 2) return null;
      const first = pointers[0];
      const second = pointers[1];
      return {
        distance: Math.hypot(second.x - first.x, second.y - first.y),
        centerX: (first.x + second.x) / 2,
        centerY: (first.y + second.y) / 2
      };
    };

    const beginPinch = () => {
      const geometry = getPinchGeometry();
      if (!geometry) return;
      pinchStartDistance = Math.max(1, geometry.distance);
      pinchStartZoom = zoom;
      pinchStartPanX = panX;
      pinchStartPanY = panY;
      pinchStartCenterX = geometry.centerX;
      pinchStartCenterY = geometry.centerY;
      pointerMoved = true;
    };

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
      zoom = Math.min(6, Math.max(1, nextZoom));
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
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      fullImage.setPointerCapture(event.pointerId);
      if (activePointers.size === 2) {
        beginPinch();
        fullImage.classList.add("is-panning");
        return;
      }
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragOriginX = panX;
      dragOriginY = panY;
      pointerMoved = false;
      fullImage.classList.add("is-panning");
    });

    fullImage.addEventListener("pointermove", (event) => {
      if (!activePointers.has(event.pointerId)) return;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activePointers.size >= 2) {
        const geometry = getPinchGeometry();
        if (!geometry) return;
        panX = pinchStartPanX + geometry.centerX - pinchStartCenterX;
        panY = pinchStartPanY + geometry.centerY - pinchStartCenterY;
        setZoom(pinchStartZoom * (geometry.distance / pinchStartDistance));
        return;
      }
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
      if (!activePointers.has(event.pointerId)) return;
      const wasPinching = activePointers.size > 1;
      activePointers.delete(event.pointerId);
      if (!fullImage.hasPointerCapture(event.pointerId)) return;
      const swipeX = event.clientX - dragStartX;
      const swipeY = event.clientY - dragStartY;
      fullImage.releasePointerCapture(event.pointerId);
      if (wasPinching) {
        const remainingPointer = [...activePointers.values()][0];
        if (remainingPointer) {
          dragStartX = remainingPointer.x;
          dragStartY = remainingPointer.y;
          dragOriginX = panX;
          dragOriginY = panY;
        } else {
          fullImage.classList.remove("is-panning");
        }
        return;
      }
      fullImage.classList.remove("is-panning");
      if (zoom === 1 && pointerMoved && Math.abs(swipeX) > 55 && Math.abs(swipeX) > Math.abs(swipeY) * 1.25) {
        showImage(currentIndex + (swipeX < 0 ? 1 : -1));
        return;
      }
      if (!pointerMoved) setZoom(zoom === 1 ? 2.5 : 1);
    };

    fullImage.addEventListener("pointerup", finishPan);
    fullImage.addEventListener("pointercancel", (event) => {
      activePointers.delete(event.pointerId);
      if (fullImage.hasPointerCapture(event.pointerId)) {
        fullImage.releasePointerCapture(event.pointerId);
      }
      if (!activePointers.size) fullImage.classList.remove("is-panning");
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
});

document.querySelectorAll(".assignment-two-poster").forEach((poster) => {
  const toggle = poster.querySelector(".poster-inline-toggle");
  const viewport = poster.querySelector(".poster-inline-viewport");
  if (!toggle || !viewport) return;
  let dragging = false;
  let dragPointer = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragScrollLeft = 0;
  let dragScrollTop = 0;
  let dragMoved = false;
  let suppressViewportClick = false;
  const expandLabel = toggle.dataset.expandLabel || "Enlarge process poster";
  const collapseLabel = toggle.dataset.collapseLabel || "Reduce process poster";

  const setPosterExpanded = (expanded) => {
    poster.classList.toggle("is-expanded", expanded);
    toggle.setAttribute("aria-expanded", String(expanded));
    const label = expanded ? collapseLabel : expandLabel;
    toggle.setAttribute("aria-label", label);
    toggle.title = label;
    if (expanded) {
      requestAnimationFrame(() => {
        viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
        viewport.scrollTop = 0;
      });
    }
    if (!expanded) {
      viewport.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  toggle.addEventListener("click", () => {
    setPosterExpanded(!poster.classList.contains("is-expanded"));
  });

  viewport.addEventListener("pointerdown", (event) => {
    if (!poster.classList.contains("is-expanded") || event.pointerType !== "mouse" || event.button !== 0) return;
    dragging = true;
    dragPointer = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragScrollLeft = viewport.scrollLeft;
    dragScrollTop = viewport.scrollTop;
    dragMoved = false;
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("is-dragging");
    event.preventDefault();
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== dragPointer) return;
    if (Math.hypot(event.clientX - dragStartX, event.clientY - dragStartY) > 5) dragMoved = true;
    viewport.scrollLeft = dragScrollLeft - (event.clientX - dragStartX);
    viewport.scrollTop = dragScrollTop - (event.clientY - dragStartY);
  });

  const finishPosterDrag = (event) => {
    if (!dragging || event.pointerId !== dragPointer) return;
    dragging = false;
    dragPointer = null;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    viewport.classList.remove("is-dragging");
    suppressViewportClick = dragMoved;
  };

  viewport.addEventListener("pointerup", finishPosterDrag);
  viewport.addEventListener("pointercancel", finishPosterDrag);
  viewport.addEventListener("click", () => {
    if (!poster.classList.contains("is-expanded")) return;
    if (suppressViewportClick) {
      suppressViewportClick = false;
      return;
    }
    setPosterExpanded(false);
  });
});
