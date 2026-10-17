window.addEventListener("load", function () {
  gsap.registerPlugin(ScrollTrigger);

  window.scrollTo(0, 0);

  const pageContainer = document.querySelector(".container");
  pageContainer.setAttribute("data-scroll-container", "");

  const scroller = new LocomotiveScroll({
    el: pageContainer,
    smooth: true,
    getDirection: true
  });

  scroller.on("scroll", function (t) {
    document.documentElement.setAttribute("data-direction", t.direction);
  });

  scroller.on("scroll", ScrollTrigger.update);

  ScrollTrigger.scrollerProxy(pageContainer, {
    scrollTop(value) {
      return arguments.length
        ? scroller.scrollTo(value, 0, 0)
        : scroller.scroll.instance.scroll.y;
    },
    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight
      };
    },
    pinType: pageContainer.style.transform ? "transform" : "fixed"
  });

  // Pinning and horizontal scrolling — desktop only
  if (window.innerWidth >= 768) {
    const horizontalSections = document.querySelectorAll(".horizontal-scroll");
    horizontalSections.forEach((horizontalSection) => {
      const pinWrap = horizontalSection.querySelector(".pin-wrap");
      const pinWrapWidth = pinWrap.offsetWidth;
      const horizontalScrollLength = pinWrapWidth - window.innerWidth;
      gsap.to(pinWrap, {
        scrollTrigger: {
          scroller: "[data-scroll-container]",
          scrub: true,
          trigger: horizontalSection,
          pin: true,
          start: "top top",
          end: () => `+=${pinWrap.offsetWidth - window.innerWidth}`,
          invalidateOnRefresh: true
        },
        x: () => -(pinWrap.offsetWidth - window.innerWidth),
        ease: "none"
      });
    });
  }

  /* COLOR CHANGER */
  const scrollColorElems = document.querySelectorAll("[data-bgcolor]");
  scrollColorElems.forEach((colorSection, i) => {
    const prevBg   = i === 0 ? "" : scrollColorElems[i - 1].dataset.bgcolor;
    const prevText = i === 0 ? "" : scrollColorElems[i - 1].dataset.textcolor;

    ScrollTrigger.create({
      trigger: colorSection,
      scroller: "[data-scroll-container]",
      start: "top 50%",
      onEnter: () =>
        gsap.to("body", {
          backgroundColor: colorSection.dataset.bgcolor,
          color: colorSection.dataset.textcolor,
          overwrite: "auto"
        }),
      onLeaveBack: () =>
        gsap.to("body", {
          backgroundColor: prevBg,
          color: prevText,
          overwrite: "auto"
        })
    });
  });

  ScrollTrigger.addEventListener("refresh", () => scroller.update());
  ScrollTrigger.refresh();

  // Refresh Locomotive + GSAP on resize; reload on breakpoint cross so
  // horizontal-scroll initialisation stays correct.
  let prevMobile = window.innerWidth < 768;
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const isMobile = window.innerWidth < 768;
      if (isMobile !== prevMobile) {
        location.reload();
        return;
      }
      scroller.update();
      ScrollTrigger.refresh();
    }, 250);
  });
});
