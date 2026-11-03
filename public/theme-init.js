/* Runs before the page paints so the saved theme never flashes. Dark is the default. */
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    var a = localStorage.getItem('accent');
    if (a) document.documentElement.setAttribute('data-accent', a);
  } catch (e) {}
})();
