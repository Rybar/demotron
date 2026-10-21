// lesson.js: steps a Demotron lesson.
// The page owns the slide: it shows that slide's text (and code, unless the
// lesson hides it) and tells the cart by writing the cart frame's URL hash,
// "s=5". The cart reads it with stat(153): a new slide restarts that demo.
// There are no controls under the cart: anything a reader changes is on the
// slide itself, worked with the mouse (kit/ui.lua). The page's own hash (#5)
// deep-links a slide.
(function () {
  var frame = document.getElementById("cart");
  var count = document.getElementById("count");
  var prev = document.getElementById("prev");
  var next = document.getElementById("next");
  var captions = Array.prototype.slice.call(document.querySelectorAll("section.caption"));
  // each slide's demo code sits in its caption
  var codes = captions.map(function (c) { return c.querySelector("div.code.slidecode"); });
  var textPane = document.querySelector(".captions");
  // @layout scroll: every section stays on the page and scrolling picks the slide
  var scrollMode = !!document.querySelector(".workbench.scroll");
  var autoScrolling = false, autoTimer = 0;
  var total = captions.length;
  var slide = Math.min(Math.max(parseInt(location.hash.slice(1), 10) || 1, 1), total);

  function cartHash() { return "s=" + slide; }

  // Only talk to the frame once player.html is really in it. Before its first
  // load the frame holds a temporary about:blank, and writing a hash there
  // (Firefox) navigates it to about:blank#s=1 instead: a blank cart, no error.
  function playerReady() {
    try {
      return frame.contentWindow.location.pathname.slice(-11) === "player.html" &&
             frame.contentDocument.readyState !== "uninitialized";
    } catch (e) {
      return false;
    }
  }

  function tellCart() {
    if (!playerReady()) return;          // the load handler below sends it
    try {
      frame.contentWindow.location.hash = cartHash();
    } catch (e) {
      // a cross-origin frame (file://): fall back to reloading it
      frame.src = "player.html#" + cartHash();
    }
  }
  frame.addEventListener("load", function () { tellCart(); });

  function focusCart() {
    frame.focus();
    try { frame.contentWindow.focus(); } catch (e) {}
  }

  // scroll the page so section n's heading sits near the top, and ignore the
  // scroll events that causes (they'd otherwise step through every slide in between)
  function scrollToSlide(n, smooth) {
    var c = captions[n - 1];
    if (!c) return;
    autoScrolling = true;
    clearTimeout(autoTimer);
    var top = c.getBoundingClientRect().top + window.scrollY - 12;
    window.scrollTo({ top: top, behavior: smooth ? "smooth" : "auto" });
    autoTimer = setTimeout(function () { autoScrolling = false; }, smooth ? 900 : 50);
  }

  function show(n, keepFocus, fromScroll) {
    var changed = Math.min(Math.max(n, 1), total) !== slide;
    slide = Math.min(Math.max(n, 1), total);
    if (scrollMode) {
      captions.forEach(function (c, i) { c.classList.toggle("current", i === slide - 1); });
      if (!fromScroll) scrollToSlide(slide, true);
    } else {
      captions.forEach(function (c, i) { c.hidden = i !== slide - 1; });
    }
    // a new slide's text starts at its top: scroll back up if we'd read down past it
    if (!scrollMode && textPane && textPane.getBoundingClientRect().top < 0) textPane.scrollIntoView({ block: "start" });
    count.textContent = slide + " / " + total;
    prev.disabled = slide === 1;
    next.disabled = slide === total;
    history.replaceState(null, "", "#" + slide);
    if (changed || !fromScroll) tellCart();
    if (!keepFocus) focusCart();
  }

  // reading down the page: the section crossing a line a third of the way down
  // the window is the current slide (the last one once we reach the bottom)
  function slideAtScroll() {
    var line = window.innerHeight * 0.35, n = 1;
    captions.forEach(function (c, i) { if (c.getBoundingClientRect().top <= line) n = i + 1; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) n = total;
    return n;
  }
  if (scrollMode) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (autoScrolling) {
        // keep ignoring until the smooth scroll settles
        clearTimeout(autoTimer);
        autoTimer = setTimeout(function () { autoScrolling = false; }, 150);
        return;
      }
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var n = slideAtScroll();
        if (n !== slide) show(n, true, true);
      });
    }, { passive: true });
  }

  codes.forEach(function (block) {
    if (!block) return;
    block.querySelector("button.copy").addEventListener("click", function (e) {
      var b = e.currentTarget;
      navigator.clipboard.writeText(block.querySelector("textarea.raw").value).then(function () {
        b.textContent = "Copied";
        setTimeout(function () { b.textContent = "Copy"; }, 1500);
      });
    });
  });

  document.querySelectorAll("div.code.snippet button.copy").forEach(function (b) {
    b.addEventListener("click", function () {
      navigator.clipboard.writeText(b.closest("div.code").querySelector("textarea.raw").value).then(function () {
        b.textContent = "Copied";
        setTimeout(function () { b.textContent = "Copy"; }, 1500);
      });
    });
  });

  prev.addEventListener("click", function () { show(slide - 1); });
  next.addEventListener("click", function () { show(slide + 1); });
  document.addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("input, textarea, button")) return;
    if (e.key === "ArrowRight" || e.key === "]") { show(slide + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft" || e.key === "[") { show(slide - 1); e.preventDefault(); }
  });

  // the page already points the frame at slide 1; only a deep link changes it
  if (slide !== 1) frame.src = "player.html#s=" + slide;
  if (scrollMode) {
    var start = slide;
    slide = 0;                       // so show() counts it as a change
    show(start, true, start === 1);  // a deep link scrolls to its section
  } else {
    show(slide, true);
  }
})();
