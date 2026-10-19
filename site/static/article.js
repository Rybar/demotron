// article.js: Demotron article lessons (scrolling posts).
// Each "Run it here" panel holds one demo from the lesson's cart. Nothing loads
// until it's clicked; then the panel becomes the cart, started straight away
// (go=1) on that demo (s=N).
(function () {
  document.querySelectorAll("div.embed").forEach(function (box) {
    box.querySelector("button").addEventListener("click", function () {
      var frame = document.createElement("iframe");
      frame.src = "player.html#s=" + box.dataset.slide + "&go=1";
      frame.title = "Lesson demo";
      frame.allow = "autoplay; fullscreen";
      box.innerHTML = "";
      box.classList.add("running");
      box.appendChild(frame);
      frame.addEventListener("load", function () { frame.focus(); });
    });
  });

  document.querySelectorAll("div.code button.copy").forEach(function (b) {
    b.addEventListener("click", function () {
      var raw = b.closest("div.code").querySelector("textarea.raw").value;
      navigator.clipboard.writeText(raw).then(function () {
        b.textContent = "Copied";
        setTimeout(function () { b.textContent = "Copy"; }, 1500);
      });
    });
  });
})();
