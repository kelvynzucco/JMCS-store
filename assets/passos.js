function queryDomNodes(selectors, context) {
  const nodes = {};
  for (const [key, selector] of Object.entries(selectors)) {
    nodes[key] = Array.from(context.querySelectorAll(selector));
  }
  return nodes;
}

if (!customElements.get("collection-tabs")) {
  class CollectionTabs extends HTMLElement {
    constructor() {
      super();
      this.selectors = {
        images: [".m-collection-tab__image"],
        collapsibleTabs: ["collapsible-tab"],
      };
    }

    init() {
      this.domNodes = queryDomNodes(this.selectors, this);
      this.isPausing = false;
      this.autoplay = this.dataset.autoplay === "true";
      this.autoplayDuration = this.dataset.autoplayDuration
        ? parseInt(this.dataset.autoplayDuration)
        : 5;
      this.autoplayTimer = null;
      this.tabActiveIndex = 0;
      this.totalTabs = this.domNodes.collapsibleTabs.length;
      this.hoverToOpen =
        this.dataset.triggerBehavior === "hover" &&
        window.matchMedia("(hover: hover)").matches;
    }

    connectedCallback() {
      this.init();

      if (this.autoplay) {
        this.style.setProperty(
          "--autoplay-duration",
          this.autoplayDuration + "s"
        );
        this.initAutoplay();

        this.observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.isPausing = false;
              this.openNextTab();
            } else {
              this.isPausing = true;
              clearTimeout(this.autoplayTimer);
            }
          });
        });
        this.observer.observe(this);
      }

      window.MinimogEvents?.subscribe?.(
        "ON_COLLAPSIBLE_TAB_OPENED",
        (collapsibleTab) => {
          if (collapsibleTab.classList.contains("collection-tab")) {
            const collectionTabs = collapsibleTab.closest("collection-tabs");
            if (collectionTabs === this) {
              this.onTabOpened(collapsibleTab);
            }
          }
        }
      );

      window.MinimogEvents?.subscribe?.(
        "ON_COLLAPSIBLE_TAB_SELECTED",
        (collapsibleTab) => {
          if (collapsibleTab.classList.contains("collection-tab")) {
            const collectionTabs = collapsibleTab.closest("collection-tabs");
            if (collectionTabs === this) {
              this.onElementSelected(collapsibleTab);
            }
          }
        }
      );

      if (this.hoverToOpen) {
        this.domNodes.collapsibleTabs.forEach((collapsibleTab) => {
          collapsibleTab.addEventListener(
            "mouseenter",
            this.onMouseEnterCollapsibleTabs.bind(this)
          );
        });
      }
    }

    onElementSelected(collapsibleTab) {
      const index = this.domNodes.collapsibleTabs.indexOf(collapsibleTab);
      if (index !== -1) {
        this.tabActiveIndex = index;
      }

      this.domNodes.images.forEach((image) => {
        if (collapsibleTab.dataset.blockId === image.dataset.blockId) {
          image.classList.add("is-active");
        } else {
          image.classList.remove("is-active");
        }
      });
    }

    onTabOpened(collapsibleTab) {
      if (!this.isPausing) {
        this.initAutoplay();
      }
    }

    initAutoplay() {
      clearTimeout(this.autoplayTimer);
      this.autoplayTimer = setTimeout(() => {
        this.openNextTab();
      }, this.autoplayDuration * 1000);
    }

    openNextTab() {
      this.tabActiveIndex =
        this.totalTabs <= this.tabActiveIndex + 1 ? 0 : this.tabActiveIndex + 1;
      this.domNodes.collapsibleTabs[this.tabActiveIndex].toggle?.();
    }

    onMouseEnterCollapsibleTabs(event) {
      const collapsibleTab = event.target;
      const index = this.domNodes.collapsibleTabs.indexOf(collapsibleTab);
      if (index !== -1) {
        this.tabActiveIndex = index;
        collapsibleTab.toggle?.(event);
      }
    }

    disconnectedCallback() {
      if (this.observer) {
        this.observer.disconnect();
      }
      if (this.hoverToOpen) {
        this.domNodes.collapsibleTabs.forEach((collapsibleTab) => {
          collapsibleTab.removeEventListener(
            "mouseenter",
            this.onMouseEnterCollapsibleTabs.bind(this)
          );
        });
      }
    }
  }

  customElements.define("collection-tabs", CollectionTabs);
}

function initPassoSwiper() {
  if (typeof Swiper === "undefined") {
    console.warn("Swiper não carregado.");
    return;
  }

  document.querySelectorAll(".swiper--passo-a-passo").forEach((slider) => {
    if (!slider.classList.contains("swiper-initialized")) {
      new Swiper(slider, {
        loop: true,
        pagination: {
          el: slider.querySelector(".swiper-pagination"),
          clickable: true,
        },
        autoplay: {
          delay: 3000,
          disableOnInteraction: true,
        },
        on: {
          init: () => slider.classList.add("swiper-initialized"),
        },
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initPassoSwiper();
  initTabClassWatcher();
});
document.addEventListener("shopify:section:load", () => {
  initPassoSwiper();
  initTabClassWatcher();
});

function initTabClassWatcher() {
  document.querySelectorAll(".block-collection-tab").forEach((block) => {
    const tab = block.querySelector(".collection-tab");

    if (!tab) return;

    const update = () => {
      block.classList.toggle(
        "is-tab-expanded",
        tab.classList.contains("is-expanded")
      );
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(tab, { attributes: true, attributeFilter: ["class"] });
  });
}
