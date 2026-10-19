// pixelfit.js: Picotron's screen is only ever shown at a whole-number scale.
//
// The live cart (.cart), article demos (div.embed) and real Picotron screenshots
// (figure.shot images whose size is a multiple of 480x270) are sized to exactly
// 480x270 times n device pixels, with n a whole number: never squashed, never
// stretched. n is the largest that fits the space, up to MAX_CSS wide. Below 1x
// nothing shrinks: the element keeps 480x270 and its window scrolls sideways.
// Each one is also nudged onto whole device pixels so its pixels stay crisp.
(function () {
  var MAX_CSS = 960;   // the biggest we choose by ourselves: 2x on an ordinary screen

  function dpr() { return window.devicePixelRatio || 1; }

  // width and height in CSS px for the largest whole scale that fits `avail`
  function size(avail) {
    var r = dpr();
    var n = Math.max(1, Math.floor(Math.min(avail, MAX_CSS) * r / 480));
    return { w: 480 * n / r, h: 270 * n / r };
  }

  function isScreenshot(img) {
    var w = img.naturalWidth, h = img.naturalHeight;
    return w > 0 && w % 480 === 0 && h * 16 === w * 9;
  }

  // centre `el` (already sized) in [left, left + width] of the viewport, on whole device pixels
  function place(el, areaLeft, areaWidth, w) {
    var r = dpr();
    el.style.marginLeft = "0px";
    el.style.transform = "none";
    var want = Math.round((areaLeft + Math.max(0, (areaWidth - w) / 2)) * r) / r;
    var now = el.getBoundingClientRect();
    el.style.marginLeft = (want - now.left) + "px";
    var top = el.getBoundingClientRect().top;
    var off = Math.round(top * r) / r - top;
    if (Math.abs(off) > 0.001) el.style.transform = "translateY(" + off + "px)";
  }

  // the content box of `el` (inside its padding), in viewport coordinates
  function contentBox(el) {
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    var pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0;
    return { left: r.left + pl, width: r.width - pl - pr };
  }

  function fitBox(el, areaLeft, areaWidth) {
    var s = size(areaWidth);
    el.style.width = s.w + "px";
    el.style.height = s.h + "px";
    el.style.maxWidth = "none";
    place(el, areaLeft, areaWidth, s.w);
  }

  function run() {
    // slideshow lessons: the cart fills its column at a whole scale
    document.querySelectorAll(".cart").forEach(function (cart) {
      var col = cart.closest(".cartcol") || cart.parentElement;
      var win = cart.closest(".cartwin") || cart;   // the window around it moves with it
      var r = col.getBoundingClientRect();
      var s = size(r.width);
      cart.style.width = s.w + "px";
      cart.style.height = s.h + "px";
      win.style.width = s.w + "px";
      place(win, r.left, r.width, s.w);
    });
    // article demos break out of the text column, across their window
    document.querySelectorAll("div.embed").forEach(function (box) {
      var a = contentBox(box.closest(".win-body") || document.body);
      fitBox(box, a.left, a.width);
    });
    // screenshots of Picotron's screen: the same rule (inside a caption they stay in the caption)
    document.querySelectorAll("figure.shot img").forEach(function (img) {
      if (!img.complete || !isScreenshot(img)) return;
      var fig = img.closest("figure");
      var area = contentBox(img.closest(".caption") || img.closest(".win-body") || document.body);
      var s = size(area.width);
      img.style.width = s.w + "px";
      img.style.height = s.h + "px";
      img.style.maxWidth = "none";
      fig.classList.add("pixel-fit");
      fig.style.width = s.w + "px";
      place(fig, area.left, area.width, s.w);
    });
  }

  var queued = false;
  function later() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; run(); });
  }
  window.addEventListener("resize", later);
  window.addEventListener("load", later);
  document.querySelectorAll("figure.shot img").forEach(function (img) { img.addEventListener("load", later); });
  // a slide change can show a caption with a screenshot in it
  document.addEventListener("click", function () { setTimeout(later, 0); });
  document.addEventListener("keydown", function () { setTimeout(later, 0); });
  later();
  window.demotronPixelFit = run;
})();
