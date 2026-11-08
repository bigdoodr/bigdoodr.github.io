/* Theme picker: wires the header control to <html data-theme / data-palette>.
   The initial values are set earlier by _includes/theme-init.html. */
(function () {
  var root = document.documentElement;
  var media = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
  var PALETTES = ["aurora", "sunset", "forest", "ocean", "mono"];
  var MODES = ["auto", "light", "dark"];

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  function resolved(mode) {
    return mode === "dark" || (mode === "auto" && media && media.matches) ? "dark" : "light";
  }

  function apply(mode, palette) {
    if (MODES.indexOf(mode) < 0) mode = "auto";
    if (PALETTES.indexOf(palette) < 0) palette = "aurora";
    var theme = resolved(mode);
    root.setAttribute("data-mode", mode);
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-palette", palette);
    syncControls(mode, palette, theme);
    document.dispatchEvent(new CustomEvent("themechange", { detail: { mode: mode, theme: theme, palette: palette } }));
  }

  function syncControls(mode, palette, theme) {
    document.querySelectorAll('input[name="theme-mode"]').forEach(function (r) { r.checked = r.value === mode; });
    document.querySelectorAll('input[name="theme-palette"]').forEach(function (r) { r.checked = r.value === palette; });
    var note = document.querySelector(".theme-current");
    if (note) note.textContent = mode === "auto" ? "Following your system (" + theme + ")" : "";
  }

  // Keep "auto" in step with the OS
  if (media) {
    var onSystemChange = function () {
      if (root.getAttribute("data-mode") === "auto") apply("auto", root.getAttribute("data-palette"));
    };
    media.addEventListener ? media.addEventListener("change", onSystemChange) : media.addListener(onSystemChange);
  }

  // Sync across tabs
  window.addEventListener("storage", function (e) {
    if (e.key === "theme-mode" || e.key === "theme-palette") {
      apply(localStorage.getItem("theme-mode") || "auto", localStorage.getItem("theme-palette") || "aurora");
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    var picker = document.querySelector(".theme-picker");
    syncControls(root.getAttribute("data-mode") || "auto", root.getAttribute("data-palette") || "aurora", root.getAttribute("data-theme"));
    if (!picker) return;

    var button = picker.querySelector(".theme-toggle");
    function setOpen(open) {
      picker.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    }

    button.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!picker.classList.contains("is-open"));
    });
    picker.addEventListener("click", function (e) { e.stopPropagation(); });
    document.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && picker.classList.contains("is-open")) { setOpen(false); button.focus(); }
    });

    picker.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name === "theme-mode") { store("theme-mode", t.value); apply(t.value, root.getAttribute("data-palette")); }
      if (t.name === "theme-palette") { store("theme-palette", t.value); apply(root.getAttribute("data-mode"), t.value); }
    });
  });

  // Let embedded utterances comments follow the theme
  document.addEventListener("themechange", function (e) {
    var frame = document.querySelector(".utterances-frame");
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage(
        { type: "set-theme", theme: e.detail.theme === "dark" ? "photon-dark" : "github-light" },
        "https://utteranc.es"
      );
    }
  });
})();
