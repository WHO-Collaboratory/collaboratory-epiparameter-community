const Custom_ContentLoader = {

  revealIO: new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        Custom_ContentLoader.revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }),

  async fetchText(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + url);
    return r.text();
  },

  mdDOM(text) {
    const el = document.createElement('div');
    el.innerHTML = marked.parse(text);
    return el;
  },

  nodesHTML(nodes) {
    const tmp = document.createElement('div');
    nodes.forEach(n => tmp.appendChild(n.cloneNode(true)));
    tmp.querySelectorAll('img').forEach(i => i.remove());
    return tmp.innerHTML;
  },
  h2Sections(dom) {
    const result = [];
    let cur = null;

    for (const node of dom.childNodes) {
      if (node.nodeType !== 1) continue;

      if (node.tagName === 'H2') {
        if (cur) result.push(cur);

        let title = node.innerHTML.trim();
        const linkEl = node.querySelector('a');
        const href = linkEl ? linkEl.getAttribute('href') : null;

        let customProp = node.getAttribute('data-custom') || null;
        if (!customProp) {
          const match = title.match(/\{.*?custom\s*=\s*["'](.*?)["'].*?\}$/);
          if (match) {
            customProp = match[1];
            title = title.replace(/\s*\{.*\}$/, '').trim();
          }
        }

        cur = { title, href, custom: customProp, nodes: [] };

      } else if (cur) {
        cur.nodes.push(node.cloneNode(true));
      }
    }

    if (cur) result.push(cur);
    return result;
  },
  h3Sections(dom) {
    const result = [];
    let cur = null;

    for (const node of dom.childNodes) {
      if (node.nodeType !== 1) continue;
      if (node.tagName === 'H2') continue;

      if (node.tagName === 'H3') {
        if (cur) result.push(cur);

        let title = node.innerHTML.trim();
        const linkEl = node.querySelector('a');
        const href = linkEl ? linkEl.getAttribute('href') : null;

        let customProp = node.getAttribute('data-custom') || null;
        if (!customProp) {
          const match = title.match(/\{.*?custom\s*=\s*["'](.*?)["'].*?\}$/);
          if (match) {
            customProp = match[1];
            title = title.replace(/\s*\{.*\}$/, '').trim();
          }
        }

        cur = { title, href, custom: customProp, nodes: [] };

      } else if (cur) {
        cur.nodes.push(node.cloneNode(true));
      }
    }

    if (cur) result.push(cur);
    return result;
  },

  findSec(sections, keyword) {
    return sections.find(s => s.title.toLowerCase().includes(keyword.toLowerCase()));
  },

  findSecByIndex(sections, index) {
    return sections[index];
  },

  reObserve(container) {
    container.querySelectorAll('.reveal').forEach(el => {
      el.classList.remove('in-view');
      this.revealIO.observe(el);
    });
  },

  buildAbout(md) {
    const dom  = this.mdDOM(md);
    const secs = this.h3Sections(dom);
    const cards = [];

    const overview = this.findSec(secs, 'overview');
    if (overview) {
      cards.push(`
        <article class="card reveal d1">
          <h3 class="card__title">${overview.title}</h3>
          <div class="card__text">${this.nodesHTML(overview.nodes)}</div>
        </article>`);
    }

    const membership = this.findSec(secs, 'community membership');
    if (membership) {
      const beforeH4 = [], afterH4 = [];
      let pastH4 = false;
      for (const n of membership.nodes) {
        if (n.tagName === 'H4') { pastH4 = true; continue; }
        (pastH4 ? afterH4 : beforeH4).push(n);
      }

      cards.push(`
        <article class="card reveal d2">
          <h3 class="card__title">Community Membership</h3>
          <div class="card__text">${this.nodesHTML(beforeH4)}</div>
          <img src="assets/WhodoesWhat.png" alt="Who does what — community roles" class="card__img" />
        </article>`);

      if (afterH4.length) {
        const linksDiv = document.createElement('div');
        afterH4.forEach(n => linksDiv.appendChild(n.cloneNode(true)));
        const linkEls = linksDiv.querySelectorAll('a');
        let linksHTML = '<div class="card__links">';
        linkEls.forEach(a => {
          linksHTML += `<a href="${a.href}" target="_blank" rel="noopener noreferrer">${a.textContent.trim()}</a>`;
        });
        linksHTML += '</div>';
        cards.push(`
          <article class="card reveal d3">
            <h3 class="card__title">Key Initiatives</h3>
            <p class="card__text">Learn more about the initiatives that support and extend the work of this community:</p>
            ${linksHTML}
          </article>`);
      }
    }

    const status     = this.findSec(secs, 'project status');
    const workstreams = this.findSec(secs, 'workstream');
    let wsDescHTML = '';
    if (workstreams) {
      const wsTmp = document.createElement('div');
      workstreams.nodes.forEach(n => wsTmp.appendChild(n.cloneNode(true)));
      wsTmp.querySelectorAll('[id^="w"]').forEach(d => {
        wsDescHTML += `<p class="card__text" style="margin-top:0.6rem;">${d.textContent.trim()}</p>`;
      });
    }
    cards.push(`
      <article class="card card--wide reveal d4">
        <h3 class="card__title">${status ? status.title : 'Current Project Status'}</h3>
        <img src="assets/Sep2024Status.png" alt="Project status" class="card__img" />
        <p class="card__text" style="margin-top:1.1rem;font-weight:600;color:var(--navy);">Our Workstreams</p>
        <img src="assets/workstreams.png" alt="Workstreams diagram" class="card__img" />
        ${wsDescHTML}
      </article>`);

    const workshop = this.findSec(secs, 'workshop');
    let reportLink = '';
    if (workshop) {
      const wTmp = document.createElement('div');
      workshop.nodes.forEach(n => wTmp.appendChild(n.cloneNode(true)));
      wTmp.querySelectorAll('a').forEach(a => {
        if (a.href && !a.href.includes('youtube')) {
          reportLink = `<a href="${a.href}" target="_blank" rel="noopener noreferrer" class="card__link" style="margin-top:0.9rem;">Access the meeting report &#8594;</a>`;
        }
      });
    }
    cards.push(`
      <article class="card card--wide reveal d5">
        <h3 class="card__title">${workshop ? workshop.title : '2024 In-Person Workshop'}</h3>
        ${reportLink}
        <img src="assets/Report.png" alt="Workshop meeting report" class="card__img" />
      </article>`);

    return cards.join('\n');
  },

  buildCommunity(md) {
    const dom  = this.mdDOM(md);
    const secs = this.h3Sections(dom);
    const cards = [];

    const res = this.findSecByIndex(secs, 0);
    if (res) {
      const paras = res.nodes.filter(n => n.tagName === 'P');
        cards.push(`
          <article class="card1 reveal d1">
            <h3 class="card__title">${res.title}</h3>
            <div class="card__text">${paras[0].innerHTML}</div>
            <div class="card__text1">${paras[2].outerHTML}</div>
          </article>`);
    }

    const activities = this.findSecByIndex(secs, 1);
    if (activities) {
      const actTmp = document.createElement('div');
      activities.nodes.forEach(n => actTmp.appendChild(n.cloneNode(true)));
      cards.push(`
        <article class="card1 reveal d2">
          <h3 class="card__title">${activities.title}</h3>
          <div class="card__text">${actTmp.innerHTML}</div>
        </article>`);
    }

    const join = this.findSecByIndex(secs, 2);
    if (join) {
      cards.push(`
        <article class="card1 reveal d3">
          <h3 class="card__title">${join.title}</h3>
          <div class="card__text">${this.nodesHTML(join.nodes)}</div>
        </article>`);
    }

    const grepiInit = this.findSecByIndex(secs, 3);
    if (grepiInit) {
      const paras = grepiInit.nodes;
      cards.push(`
        <article class="card1 reveal d3">
          <div class="card__text"><a href="https://who-collaboratory.github.io/collaboratory-grepi-web/" target="_blank" rel="noopener noreferrer">${paras[0].outerHTML}</a></div>
        </article>`);
    }
    
    const grepiInit1 = this.findSecByIndex(secs, 4);
    if (grepiInit1) {
      const paras = grepiInit1.nodes;
      const tmp = document.createElement('div');
      grepiInit1.nodes.forEach(n => tmp.appendChild(n.cloneNode(true)));
      this.replacePdfIframes(tmp);
      console.log(paras[0].innerHTML);
      cards.push(`
        <article class="card1 reveal d3">
          <div class="card__text">${tmp.outerHTML}</div>
        </article>`);
    }
    
    const grepiInit2 = this.findSecByIndex(secs, 5);
    if (grepiInit2) {
      const paras = grepiInit2.nodes;
      console.log(paras[0].innerHTML);
      cards.push(`
        <article class="card1 reveal d3"">
          <div class="card__text">${paras[0].outerHTML}</div>
        </article>`);
    }

    return cards.join('\n');
  },

  buildNews(md) {
    const dom       = this.mdDOM(md);
    const listItems = dom.querySelectorAll('li');
    const notices   = [];
    const events    = [];

    listItems.forEach(li => {
      const strong = li.querySelector('strong');
      if (!strong) { notices.push(li.textContent.trim()); return; }
      const dateText = strong.textContent.trim();
      const descHTML = li.innerHTML.replace(/<strong>[^<]*<\/strong>\s*:?\s*/, '').trim();
      if (descHTML.toLowerCase().includes('see you again')) {
        notices.push(dateText + ': ' + descHTML.replace(/<[^>]+>/g, ''));
      } else {
        events.push({ dateText, descHTML });
      }
    });

    let html = '';

    notices.forEach(text => {
      html += `
        <div class="timeline-notice">
          <span class="timeline-notice__icon">📢</span>
          ${text}
        </div>`;
    });

    const byYear = {};
    events.forEach(ev => {
      const m = ev.dateText.match(/\b(20\d{2})\b/);
      if (!m) return;
      const yr = m[1];
      if (!byYear[yr]) byYear[yr] = [];
      byYear[yr].push(ev);
    });

    Object.keys(byYear).sort((a, b) => +b - +a).forEach(year => {
      html += `
        <div class="timeline-year">
          <span class="timeline-year__badge">${year}</span>
        </div>
        <div class="timeline-list">`;
      byYear[year].forEach(ev => {
        const tag = this.tagFromEvent(ev);
        const tagHTML = tag ? `<span class="timeline-item__tag ${tag.cls}">${tag.label}</span>` : '';
        html += `
          <div class="timeline-item">
            <div class="timeline-item__date">${ev.dateText} ${tagHTML}</div>
            <p class="timeline-item__text">${ev.descHTML}</p>
          </div>`;
      });
      html += '</div>';
    });

    return html;
  },
  
  buildInitiative5Col(md) {
    const dom = this.mdDOM(md);
    const secs = this.h3Sections(dom).filter(s => s.custom === '5Col');
    return this.buildCardsFromIndexes5col(secs, [0, 1, 2, 3, 4]);
  },

  buildInitiative4Col(md) {
    const dom = this.mdDOM(md);
    const secs = this.h3Sections(dom).filter(s => s.custom === '4Col');
    return this.buildCardsFromIndexes4col(secs, [0, 1, 2, 3]);
  },

  buildInitiative3Col(md) {
    const dom = this.mdDOM(md);
    const secs = this.h3Sections(dom).filter(s => s.custom === '3Col');
    return this.buildCardsFromIndexes(secs, [0, 1, 2], true);
  },

  buildResources(md) {
    const dom  = this.mdDOM(md);
    const secs = this.h3Sections(dom);
    return this.buildCardsFromIndexes(secs, [0, 1, 2, 3, 4, 5]);
  },

  replacePdfIframes(tmp) {
    tmp.querySelectorAll('iframe').forEach(iframe => {
      const src = iframe.getAttribute('src') || '';
      if (!src.toLowerCase().includes('.pdf')) return;

      const fileName = src.split('/').pop().replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      const thumb = document.createElement('a');
      thumb.href = src;
      thumb.target = '_blank';
      thumb.rel = 'noopener noreferrer';
      thumb.className = 'card__pdf-preview';
      thumb.innerHTML = `
        <div class="card__pdf-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="15" y2="17"/>
          </svg>
        </div>
        <span class="card__pdf-label">${tmp.textContent}</span>
        <span class="card__pdf-open">Download PDF ↗</span>
      `;
      iframe.replaceWith(thumb);
    });
  },

  buildCardsFromIndexes(secs, indexes, withBorder = false) {
    const cards = [];
    indexes.forEach(i => {
      const sec = this.findSecByIndex(secs, i);
      if (!sec) return;

      const tmp = document.createElement('div');
      sec.nodes.forEach(n => tmp.appendChild(n.cloneNode(true)));
      this.replacePdfIframes(tmp);

      let titleHTML = '';
      if (sec.title !== 'NoTitle') {
        titleHTML = sec.href
          ? `<h3 class="card__title"><a href="${sec.href}" target="_blank" rel="noopener noreferrer">${sec.title}</a></h3>`
          : `<h3 class="card__title">${sec.title}</h3>`;
      }

      cards.push(`
        <article class="${withBorder ? 'card' : 'card1'} reveal d1">
          ${titleHTML}
          <div class="card__text">${tmp.innerHTML}</div>
        </article>
      `);
    });
    return cards.join('\n');
  },
  

  buildCardsFromIndexes5col(secs, indexes) {
    const cards = [];
    indexes.forEach(i => {
      const sec = this.findSecByIndex(secs, i);
      if (!sec) return;

      const tmp = document.createElement('div');
      sec.nodes.forEach(n => tmp.appendChild(n.cloneNode(true)));
      this.replacePdfIframes(tmp);

      let titleHTML = '';
      if (sec.title !== 'NoTitle') {
        titleHTML = sec.href
          ? `<h3 class="card__title_w_icon"><a href="${sec.href}" target="_blank" rel="noopener noreferrer">${sec.title}</a></h3>`
          : `<h3 class="card__title_w_icon">${sec.title}</h3>`;
      }

      cards.push(`
        <article class="card reveal d1">
          ${titleHTML}
          <div class="card__text">${tmp.innerHTML}</div>
        </article>
      `);
    });
    return `<div class="cards-5col">${cards.join('\n')}</div>`;
  },

  buildCardsFromIndexes4col(secs, indexes) {
    const cards = [];
    indexes.forEach(i => {
      const sec = this.findSecByIndex(secs, i);
      if (!sec) return;

      const tmp = document.createElement('div');
      sec.nodes.forEach(n => tmp.appendChild(n.cloneNode(true)));
      this.replacePdfIframes(tmp);

      let titleHTML = '';
      if (sec.title !== 'NoTitle') {
        titleHTML = sec.href
          ? `<h3 class="card__title"><a href="${sec.href}" target="_blank" rel="noopener noreferrer">${sec.title}</a></h3>`
          : `<h3 class="card__title">${sec.title}</h3>`;
      }

      cards.push(`
        <article class="card reveal d1">
          ${titleHTML}
          <div class="card__text">${tmp.innerHTML}</div>
        </article>
      `);
    });
    return `<div class="cards-4col">${cards.join('\n')}</div>`;
  },

  tagFromEvent(ev) {
    const d = (ev.descHTML + ' ' + ev.dateText).toLowerCase();
    if (d.includes('virtual webinar') || d.includes('virtual presentation') || d.includes('webinar'))
      return { cls: 'tag-webinar',  label: 'Webinar'      };
    if (d.includes('in person') || d.includes('in-person') || d.includes('hackathon') || /\d[–\-]\d/.test(ev.dateText))
      return { cls: 'tag-inperson', label: 'In Person'    };
    if (d.includes('workshop'))
      return { cls: 'tag-workshop', label: 'Workshop'     };
    if (d.includes('consultation'))
      return { cls: 'tag-consult',  label: 'Consultation' };
    return null;
  },

  parseResourcesMd(text) {
    const bgRows          = [];
    const meetingSections = [];
    let current           = null;

    text.split('\n').forEach(raw => {
      const line = raw.trim();
      if (!line || line.startsWith('## ')) return;

      if (line.startsWith('### ')) {
        const heading = line.slice(4).trim();
        current = { title: heading, rows: [], isBg: heading.toLowerCase().includes('support for') };
        meetingSections.push(current);
        return;
      }

      if (line.startsWith('|') && !line.startsWith('|---')) {
        const row = this.parseTableRow(line);
        if (!row) return;
        if (current === null) bgRows.push(row);
        else current.rows.push(row);
      }
    });

    return { bgRows, meetingSections };
  },

  parseTableRow(line) {
    const parts = line.split('|').slice(1, -1).map(c => c.trim());
    if (parts.length < 2) return null;

    const iconCell = parts[0];
    const nameCell = parts[1];
    const dlCell   = parts[2] || '';

    let type = iconCell.includes('pdf-icon') ? 'pdf' : 'ext';
    const nm = nameCell.match(/\*\*\[([^\]]+)\]\(([^)]+)\)\*\*/);
    if (!nm) return null;

    const name = nm[1].trim();
    const url  = nm[2].trim();

    if      (/\.R\b/.test(url)   || name.toLowerCase().includes('r code'))                        type = 'r';
    else if (/\.Rmd\b/.test(url) || /r markdown/i.test(name) || /\brmd\b/i.test(name))           type = 'rmd';
    else if (/\.html\b/.test(url) || /html/i.test(name))                                          type = 'html';

    const dl = dlCell.match(/\[([^\]]+)\]\(([^)]+)\)/);
    return { type, name, url, dlUrl: dl ? dl[2].trim() : '' };
  },

  buildResourcesHTML(bgRows, meetingSections) {
    const mpoxSecs  = meetingSections.filter(s => s.isBg);
    const twgSecs   = meetingSections.filter(s => !s.isBg);
    const allBgRows = [...bgRows, ...mpoxSecs.flatMap(s => s.rows)];

    let gridHTML = '<div class="resources-grid reveal">';
    allBgRows.forEach(row => {
      const icon  = row.type === 'pdf' ? '📄' : '🌐';
      const badge = row.type === 'pdf'
        ? '<span class="res-badge res-badge--pdf">PDF</span>'
        : '<span class="res-badge res-badge--ext">&#8599;</span>';
      gridHTML += `
        <a href="${row.url}" target="_blank" rel="noopener noreferrer" class="res-card">
          <div class="res-card__icon">${icon}</div>
          <div>
            <div class="res-card__title">${row.name} ${badge}</div>
            ${row.dlUrl ? `<div class="res-card__desc"><a href="${row.dlUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--blue)">&#8595; Download PDF</a></div>` : ''}
          </div>
        </a>`;
    });
    gridHTML += '</div>';

    let accordionHTML = '<div class="res-accordion reveal">';
    twgSecs.forEach(sec => {
      if (!sec.rows.length) return;
      const cnt = sec.rows.length;
      accordionHTML += `
        <div class="res-group">
          <button class="res-group__hd" aria-expanded="false">
            <span class="res-group__date">${sec.title}</span>
            <span class="res-group__count">${cnt} ${cnt === 1 ? 'document' : 'documents'}</span>
            <span class="res-group__chevron">&#8250;</span>
          </button>
          <div class="res-group__body">`;
      sec.rows.forEach(row => {
        const LABELS     = { pdf: 'PDF', r: 'R', rmd: 'Rmd', html: 'HTML', ext: '&#8599;' };
        const badgeLabel = LABELS[row.type] || row.type.toUpperCase();
        accordionHTML += `
            <div class="res-doc">
              <span class="doc-badge doc-badge-${row.type}">${badgeLabel}</span>
              <span class="res-doc__name">
                <a href="${row.url}" target="_blank" rel="noopener noreferrer">${row.name}</a>
              </span>
              <div class="res-doc__btns">
                ${row.dlUrl ? `<a href="${row.dlUrl}" target="_blank" rel="noopener noreferrer" class="res-doc__btn res-doc__btn--dl">Download</a>` : ''}
              </div>
            </div>`;
      });
      accordionHTML += `
          </div>
        </div>`;
    });
    accordionHTML += '</div>';

    return { gridHTML, accordionHTML };
  },

  initAccordion(container) {
    container.querySelectorAll('.res-group__hd').forEach(btn => {
      btn.addEventListener('click', function () {
        const group  = this.closest('.res-group');
        const body   = this.nextElementSibling;
        const isOpen = group.classList.contains('is-open');
        group.classList.toggle('is-open', !isOpen);
        this.setAttribute('aria-expanded', String(!isOpen));
        body.style.maxHeight = isOpen ? '0' : body.scrollHeight + 'px';
      });
    });
    const first = container.querySelector('.res-group');
    if (first) {
      const btn  = first.querySelector('.res-group__hd');
      const body = first.querySelector('.res-group__body');
      first.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  },

  async init() {
    try {
      const [initiativeMd, communityMd, newsMd, resourcesMd] = await Promise.all([
        this.fetchText('assets/md/initiative.md'),
        this.fetchText('assets/md/community.md'),
        this.fetchText('assets/md/news.md'),
        this.fetchText('assets/md/resources.md'),
      ]);
      
      const initEl0 = document.getElementById('initiative-5-cards');
      if (initEl0) {
        initEl0.innerHTML = this.buildInitiative5Col(initiativeMd);
        this.reObserve(initEl0);
      }

      const initEl = document.getElementById('initiative-4-cards');
      if (initEl) {
        initEl.innerHTML = this.buildInitiative4Col(initiativeMd);
        this.reObserve(initEl);
      }

      const initEl2 = document.getElementById('initiative-3-cards');
      if (initEl2) {
        initEl2.innerHTML = this.buildInitiative3Col(initiativeMd);
        this.reObserve(initEl2);
      }

      const commEl = document.getElementById('community-cards');
      if (commEl) {
        commEl.innerHTML = this.buildCommunity(communityMd);
        this.reObserve(commEl);
      }

      const resEl = document.getElementById('resources-cards');
      if (resEl) {
        resEl.innerHTML = this.buildResources(resourcesMd);
        this.reObserve(resEl);
      }

    } catch (err) {
      console.error('[content-loader]', err);
    }
  },
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Custom_ContentLoader.init());
} else {
  Custom_ContentLoader.init();
}
