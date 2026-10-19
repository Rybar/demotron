// lesson.js: steps a Demotron lesson.
// The page owns the slide: it shows that slide's code (left), caption (below)
// and sliders, and tells the cart by writing the cart frame's URL hash,
// "s=5&speed=3.5". The cart reads it with stat(153): a new slide restarts that
// demo, a new slider value just sets the demo's variable. The page's own hash
// (#5) deep-links a slide.
(function () {
  var frame = document.getElementById("cart");
  var count = document.getElementById("count");
  var prev = document.getElementById("prev");
  var next = document.getElementById("next");
  var captions = Array.prototype.slice.call(document.querySelectorAll("section.caption"));
  var codes = Array.prototype.slice.call(document.querySelectorAll("div.code"));
  var total = captions.length;
  var slide = Math.min(Math.max(parseInt(location.hash.slice(1), 10) || 1, 1), total);

  function currentCode() { return codes[slide - 1]; }

  function cartHash() {
    var h = "s=" + slide;
    currentCode().querySelectorAll("input[type=range]").forEach(function (r) {
      h += "&" + r.dataset.var + "=" + r.value;
    });
    return h;
  }

  function tellCart() {
    try {
      frame.contentWindow.location.hash = cartHash();
    } catch (e) {
      // a cross-origin frame (file://): fall back to reloading it
      frame.src = "player.html#" + cartHash();
    }
  }

  function focusCart() {
    frame.focus();
    try { frame.contentWindow.focus(); } catch (e) {}
  }

  // a slider moved: show the value in the code and send it to the cart
  function setLive(block, name, value) {
    block.querySelectorAll('.live[data-var="' + name + '"]').forEach(function (s) { s.textContent = value; });
  }

  function resetSliders(block) {
    block.querySelectorAll("input[type=range]").forEach(function (r) {
      r.value = r.defaultValue;
      r.nextElementSibling.textContent = r.value;
      setLive(block, r.dataset.var, r.value);
    });
  }

  function show(n, keepFocus) {
    slide = Math.min(Math.max(n, 1), total);
    captions.forEach(function (c, i) { c.hidden = i !== slide - 1; });
    codes.forEach(function (c, i) { c.hidden = i !== slide - 1; });
    resetSliders(currentCode());
    count.textContent = slide + " / " + total;
    prev.disabled = slide === 1;
    next.disabled = slide === total;
    history.replaceState(null, "", "#" + slide);
    tellCart();
    if (!keepFocus) focusCart();
  }

  codes.forEach(function (block) {
    block.querySelectorAll("input[type=range]").forEach(function (r) {
      r.addEventListener("input", function () {
        r.nextElementSibling.textContent = r.value;
        setLive(block, r.dataset.var, r.value);
        tellCart();
      });
      // done dragging: hand the keys back to the cart
      r.addEventListener("change", focusCart);
    });
    block.querySelector("button.copy").addEventListener("click", function (e) {
      var b = e.currentTarget;
      navigator.clipboard.writeText(block.querySelector("textarea.raw").value).then(function () {
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

  frame.src = "player.html#s=" + slide;
  show(slide, true);
})();
