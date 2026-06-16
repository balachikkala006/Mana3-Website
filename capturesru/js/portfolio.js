/* CapturesRU — Pic-Time albums + live YouTube embeds */
(function () {
  const DATA_URL = 'data/portfolio.json';
  const YT_EMBED = 'https://www.youtube.com/embed/';
  const IFRAME_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderEmbed(video, featured) {
    const title = escapeHtml(video.title);
    const id = escapeHtml(video.id);
    const lazy = featured ? '' : ' loading="lazy"';
    return `
      <article class="film-embed${featured ? ' film-embed-featured' : ''}">
        ${featured ? '<p class="section-label film-embed-label">Latest film</p>' : ''}
        <div class="film-embed-player">
          <iframe
            src="${YT_EMBED}${id}?rel=0&modestbranding=1"
            title="${title}"
            allow="${IFRAME_ALLOW}"
            allowfullscreen${lazy}></iframe>
        </div>
        <h3 class="film-embed-title">${title}</h3>
        <a class="film-embed-link" href="${escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer">Open on YouTube ↗</a>
      </article>
    `;
  }

  function filterAlbums(albums, mode) {
    if (mode === 'wedding') {
      return albums.filter(album => album.category === 'wedding');
    }
    return albums;
  }

  function renderGallery(albums, portalUrl, options) {
    const track = document.getElementById('gallery-track');
    const cta = document.getElementById('gallery-cta');
    if (!track) return;

    const weddingOnly = options && options.weddingOnly;
    const label = weddingOnly ? 'wedding' : 'client';

    track.innerHTML = albums.map(album => `
      <a class="gallery-item" href="${escapeHtml(album.url)}" target="_blank" rel="noopener noreferrer">
        <img src="${escapeHtml(album.image)}" alt="${escapeHtml(album.title)}" loading="lazy" width="420" height="560">
        <div class="gallery-item-overlay"><span>${escapeHtml(album.title)}</span></div>
      </a>
    `).join('');

    if (cta) {
      cta.innerHTML = `
        <p>${albums.length} ${label} ${albums.length === 1 ? 'gallery' : 'galleries'} on Pic-Time</p>
        <a href="${escapeHtml(portalUrl)}" class="gallery-portal-btn" target="_blank" rel="noopener noreferrer">
          View all galleries on Pic-Time →
        </a>
      `;
    }
  }

  function renderFilmsPortal(videos, channelUrl) {
    const portal = document.getElementById('films-portal-preview');
    const countEl = document.getElementById('films-portal-count');
    const ytLink = document.getElementById('films-portal-youtube');
    if (!portal || !videos.length) return;

    const hero = videos[0];
    const title = escapeHtml(hero.title);
    portal.innerHTML = `
      <a href="films.html" class="films-portal-thumb">
        <img src="${escapeHtml(hero.thumb)}" alt="${title}" loading="lazy" width="640" height="360">
        <span class="films-portal-play" aria-hidden="true">▶</span>
      </a>
      <p class="films-portal-latest">${title}</p>
    `;

    if (countEl) countEl.textContent = `${videos.length}+ films`;
    if (ytLink && channelUrl) ytLink.href = channelUrl;
  }

  function renderFilms(videos, channelUrl) {
    const grid = document.getElementById('films-grid');
    const featured = document.getElementById('films-featured');
    const channelLink = document.getElementById('youtube-channel-link');
    if (!videos.length) return;

    const [hero, ...rest] = videos;

    if (featured && hero) {
      featured.innerHTML = renderEmbed(hero, true);
    }

    if (grid) {
      grid.innerHTML = rest.map(video => renderEmbed(video, false)).join('');
    }

    if (channelLink) {
      channelLink.href = channelUrl;
    }
  }

  function setAboutImage(albums) {
    const img = document.getElementById('about-photo');
    if (img && albums[0]) {
      img.src = albums[0].image;
      img.alt = albums[0].title + ' — CapturesRU Photography';
    }
  }

  function wireFooterLinks(data) {
    const picLink = document.getElementById('footer-pictime');
    const ytLink = document.getElementById('footer-youtube');
    if (picLink) picLink.href = data.picTimePortal;
    if (ytLink) ytLink.href = data.youtubeChannel;
  }

  async function init() {
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error('portfolio fetch failed');
      const data = await res.json();
      const gallerySection = document.getElementById('gallery');
      const galleryFilter = gallerySection?.dataset.filter || '';
      const galleryAlbums = filterAlbums(data.albums, galleryFilter);
      renderGallery(galleryAlbums, data.picTimePortal, {
        weddingOnly: galleryFilter === 'wedding'
      });
      if (document.getElementById('films-grid') || document.getElementById('films-featured')) {
        renderFilms(data.videos, data.youtubeChannel);
      }
      if (document.getElementById('films-portal-preview')) {
        renderFilmsPortal(data.videos, data.youtubeChannel);
      }
      setAboutImage(galleryAlbums.length ? galleryAlbums : data.albums);
      wireFooterLinks(data);
      document.dispatchEvent(new CustomEvent('portfolio:ready'));
    } catch (err) {
      console.warn('CapturesRU portfolio:', err);
      document.dispatchEvent(new CustomEvent('portfolio:ready'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
