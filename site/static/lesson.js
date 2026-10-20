// lesson.js: steps a Demotron lesson.
// The page owns the slide: it shows that slide's text and code (left) and its
// controls (sliders, toggles, number boxes, under the cart), and tells the cart by writing the cart frame's URL hash,
// "s=5&speed=3.5". The cart reads it with stat(153): a new slide restarts that
// demo, a new slider value just sets the demo's variable. The page's own hash
// (#5) deep-links a slide.
(function () {
  var frame = document.getElementById("cart");
  var count = document.getElementById("count");
  var prev = document.getElementById("prev");
  var next = document.getElementById("next");
  var captions = Array.prototype.slice.call(document.querySelectorAll("section.caption"));
  // each slide's demo code sits in its caption; its sliders sit under the cart
  var codes = Array.prototype.slice.call(document.querySelectorAll("section.caption div.code.slidecode"));
  var sliderBlocks = {};
  document.querySelectorAll(".cartcol .sliders").forEach(function (b) { sliderBlocks[b.dataset.slide] = b; });
  var textPane = document.querySelector(".captions");
  // @layout scroll: every section stays on the page and scrolling picks the slide
  var scrollMode = !!document.querySelector(".workbench.scroll");
  var autoScrolling = false, autoTimer = 0;
  var total = captions.length;
  var slide = Math.min(Math.max(parseInt(location.hash.slice(1), 10) || 1, 1), total);

  function currentCode() { return codes[slide - 1]; }
  function currentSliders() { return sliderBlocks[slide]; }

  // a slide's controls: sliders, toggles (0/1) and number boxes, all .ctl
  function ctlValue(c) { return c.type === "checkbox" ? (c.checked ? "1" : "0") : c.value; }

  function cartHash() {
    var h = "s=" + slide, block = currentSliders();
    if (block) block.querySelectorAll(".ctl").forEach(function (c) {
      h += "&" + c.dataset.var + "=" + ctlValue(c);
    });
    return h;
  }

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

  // a slider moved: show the value in the code and send it to the cart
  function setLive(block, name, value) {
    block.querySelectorAll('.live[data-var="' + name + '"]').forEach(function (s) { s.textContent = value; });
  }

  // the number beside a slider or toggle (a number box shows its own)
  function showValue(c) {
    var out = c.nextElementSibling;
    if (out && out.tagName === "OUTPUT") out.textContent = ctlValue(c);
  }

  function resetSliders() {
    var block = currentSliders();
    if (!block) return;
    block.querySelectorAll(".ctl").forEach(function (c) {
      if (c.type === "checkbox") c.checked = c.defaultChecked; else c.value = c.defaultValue;
      showValue(c);
      setLive(currentCode(), c.dataset.var, ctlValue(c));
    });
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
    Object.keys(sliderBlocks).forEach(function (k) { sliderBlocks[k].hidden = +k !== slide; });
    // a scroll that only nudges within the same section leaves the sliders alone
    if (changed || !fromScroll) resetSliders();
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

  Object.keys(sliderBlocks).forEach(function (k) {
    sliderBlocks[k].querySelectorAll(".ctl").forEach(function (c) {
      function changed() {
        if (c.type === "number") {
          // typed values stay inside the range
          var v = parseFloat(c.value);
          if (isNaN(v)) return;
          if (v < +c.min) c.value = c.min;
          if (v > +c.max) c.value = c.max;
        }
        showValue(c);
        setLive(codes[k - 1], c.dataset.var, ctlValue(c));
        tellCart();
      }
      c.addEventListener("input", changed);
      // done dragging, clicking or typing: hand the keys back to the cart
      c.addEventListener("change", function () { changed(); focusCart(); });
    });
    // a number box's - and + buttons
    sliderBlocks[k].querySelectorAll(".stepper").forEach(function (st) {
      var box = st.querySelector("input");
      [["dec", -1], ["inc", 1]].forEach(function (b) {
        st.querySelector("." + b[0]).addEventListener("click", function () {
          if (b[1] < 0) box.stepDown(); else box.stepUp();
          box.dispatchEvent(new Event("change"));
        });
      });
    });
  });

  codes.forEach(function (block) {
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
