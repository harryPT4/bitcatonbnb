(function () {
  'use strict';
  var canvas = document.getElementById('memeCanvas');
  if (!canvas || canvas.dataset.ready) return;
  canvas.dataset.ready = 'true';
  var ctx = canvas.getContext('2d');
  var top = document.getElementById('memeTop');
  var bottom = document.getElementById('memeBottom');
  var download = document.getElementById('downloadMeme');
  var status = document.getElementById('memeStatus');
  var image = new Image();
  var loaded = false;

  function caption(text, y) {
    // Fit arbitrary user text to the artwork, without cropping long captions.
    var size = 70;
    do { ctx.font = '700 ' + size + 'px "Atkinson Hyperlegible", Arial, sans-serif'; size -= 2; }
    while (ctx.measureText(text).width > 940 && size > 16);
    ctx.fillText(text, 540, y);
  }
  function render() {
    if (!ctx || !loaded) return;
    ctx.fillStyle = '#FCFBF7'; ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = '#E3A21A'; ctx.fillRect(0, 0, 1080, 14);
    var scale = Math.min(750 / image.width, 690 / image.height);
    var width = image.width * scale, height = image.height * scale;
    ctx.drawImage(image, (1080 - width) / 2, 160 + (690 - height) / 2, width, height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#15120E';
    caption(top.value, 116); caption(bottom.value, 925);
    ctx.font = '24px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#6D655A'; ctx.fillText('BITCAT  /  bitcatbnb.family', 540, 1028);
    canvas.setAttribute('aria-label', 'Bitcat meme: ' + top.value + ' ' + bottom.value);
  }
  image.onload = function () { loaded = true; render(); download.disabled = !ctx; status.textContent = ctx ? 'Your cat is ready.' : 'Image creation is unavailable in this browser.'; };
  image.onerror = function () { status.textContent = 'The cat image could not load. Refresh to try again.'; };
  image.src = '/assets/bitcat-mascot-transparent.png';
  if (document.fonts) document.fonts.ready.then(render);
  [top, bottom].forEach(function (input) {
    input.addEventListener('input', function () {
      document.querySelectorAll('[data-caption]').forEach(function (button) { button.setAttribute('aria-pressed', 'false'); });
      render();
    });
  });
  document.querySelectorAll('[data-caption]').forEach(function (button) {
    button.addEventListener('click', function () {
      var lines = button.dataset.caption.split('|'); top.value = lines[0]; bottom.value = lines[1];
      document.querySelectorAll('[data-caption]').forEach(function (preset) { preset.setAttribute('aria-pressed', String(preset === button)); });
      render(); status.textContent = 'Caption updated. Make it your own.';
    });
  });
  download.addEventListener('click', function () {
    if (!loaded || !ctx) return;
    render();
    canvas.toBlob(function (blob) {
      if (!blob) { status.textContent = 'Could not create the image. Please try again.'; return; }
      var url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'bitcat-still-here.png';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
      status.textContent = 'PNG prepared. Share it wherever your cat people are.';
    }, 'image/png');
  });
  document.getElementById('copyInvite').addEventListener('click', async function () {
    var text = document.getElementById('contributionInvite').textContent;
    var result = document.getElementById('inviteStatus');
    try { await navigator.clipboard.writeText(text); result.textContent = 'Copied. Paste it in your group when you’re ready.'; }
    catch (_) { result.textContent = 'Copy unavailable. Select the invitation text above to copy it.'; }
  });
})();
