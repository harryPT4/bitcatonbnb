/** Trusted editorial content. Interactive controls are owned by community.js. */
export const communityMarkup = `
<section id="make" class="club-section" aria-labelledby="makeTitle">
  <div class="wrap">
    <div class="club-heading">
      <div><p class="sec-eyebrow">The little Bitcat studio</p><h2 id="makeTitle">Make something<br>ridiculous.</h2></div>
      <p>A cat, a caption, your questionable sense of humour. Make a postcard for the group or keep it for yourself.</p>
    </div>
    <div class="studio-grid">
      <div class="meme-preview">
        <canvas id="memeCanvas" width="1080" height="1080" role="img" aria-label="Your Bitcat meme preview"></canvas>
        <noscript><img src="/assets/bitcat-pfp.jpg" alt="Bitcat sitting beside a Bitcoin coin"><p>Enable JavaScript to customise a meme.</p></noscript>
      </div>
      <div class="studio-controls">
        <span class="studio-number">01 / PICK A MOOD</span>
        <div class="mood-options" role="group" aria-label="Caption presets">
          <button type="button" data-caption="still here.|still judging." aria-pressed="true">Still here</button>
          <button type="button" data-caption="one more game.|said 17 games ago." aria-pressed="false">One more round</button>
          <button type="button" data-caption="no thoughts.|only mouse." aria-pressed="false">Mouse brain</button>
        </div>
        <label for="memeTop">Top caption</label>
        <input id="memeTop" maxlength="64" value="still here." autocomplete="off">
        <label for="memeBottom">Bottom caption</label>
        <input id="memeBottom" maxlength="64" value="still judging." autocomplete="off">
        <span class="studio-number">02 / TAKE THE CAT WITH YOU</span>
        <button id="downloadMeme" class="btn-primary" type="button" disabled>Download your meme</button>
        <p id="memeStatus" class="studio-status" role="status">Loading the cat…</p>
        <p class="studio-note">Created in your browser. No wallet, upload, or account. The image includes the site address so friends can find their way here.</p>
      </div>
    </div>
  </div>
</section>
<section id="contribute" class="club-section alt" aria-labelledby="contributeTitle">
  <div class="wrap">
    <p class="sec-eyebrow">An open invitation</p>
    <h2 id="contributeTitle">One small thing<br>can help.</h2>
    <p class="sec-lede">I built this site and the game, and I’m continuing on my own. If you feel like helping, pick a small task. You don’t have to buy anything or commit to a role.</p>
    <div class="contribution-grid">
      <article><span class="studio-number">DRAW</span><h3>Give the cat a scene.</h3><p>A reaction face, a wallpaper, or a sticker. Original art with your credit.</p></article>
      <article><span class="studio-number">PLAY</span><h3>Find the rough edges.</h3><p>Try Flap on your phone. Tell the group what felt fun, confusing, or broken.</p></article>
      <article><span class="studio-number">BUILD</span><h3>Bring one useful idea.</h3><p>A small feature, a copy fix, or a piece of code. Small contributions count.</p></article>
    </div>
    <div class="invitation-box">
      <div><h3>Start a conversation in your group.</h3><p id="contributionInvite">I’m continuing to build bitcatbnb.family myself. The site and Flap game are live, and I want to make them fun enough that people come back. I can’t promise what happens to the token. If anyone wants to help with art, game ideas, testing, posts, or development, even one small contribution would help. Reply here with what you’d like to try.</p></div>
      <div><button type="button" class="btn-ghost" id="copyInvite">Copy invitation</button><p id="inviteStatus" role="status"></p></div>
    </div>
    <p class="studio-note">This copies a draft for you to share. There is no submission form or inbox here yet; use the group you already know.</p>
  </div>
</section>
`;
