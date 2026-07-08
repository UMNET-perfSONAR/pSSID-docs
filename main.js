/* ===================== DATA ===================== */
const TREE = [
    {id:'about', title:'About'},
    {id:'installation', title:'Installation', children:[
      {id:'install-materials', title:'Required Materials'},
      {id:'install-probes', title:'Probes', children:[
        {id:'probes-daemon', title:'Installing the Daemon', children:[
          {id:'daemon-manual-bootstrap', title:'Manual Bootstrapping'},
          {id:'daemon-ansible-bootstrap', title:'Ansible Bootstrapping'},
        ]},
        {id:'probes-container', title:'Container Install', children:[
          {id:'container-manual-docker', title:'Manual Docker Install'},
        ]},
        {id:'probes-pxe', title:'PXE Booting Deployment'},
      ]},
      {id:'install-gui', title:'GUI Server', children:[
        {id:'gui-ansible-script', title:'Ansible Script Deployment'},
        {id:'gui-ansible-server-build', title:'Ansible Server Build'},
        {id:'gui-usage-pushing', title:'Server Usage & Pushing Configs'},
      ]},
      {id:'install-analytics', title:'Data Analytics Stack', children:[
        {id:'analytics-installation', title:'Installation'},
        {id:'analytics-grafana', title:'Grafana Configuration'},
      ]},
    ]},
    {id:'configuration', title:'Configuration', children:[
      {id:'config-probe-files', title:'Probe Configuration Files', children:[
        {id:'config-pssid-json', title:'pssid_config.json'},
        {id:'config-wpa-supplicant', title:'wpa_supplicant'},
      ]},
      {id:'config-daemon-options', title:'Daemon Options', children:[
        {id:'daemon-useful-flags', title:'Useful Flags'},
        {id:'daemon-custom-scripts', title:'Custom Scripts'},
      ]},
      {id:'config-hardware-changes', title:'Hardware Changes', children:[
        {id:'hardware-wifi6', title:'WiFi 6 Support'},
      ]},
    ]},
    {id:'testing', title:'Testing', children:[
      {id:'testing-logs', title:'Logs', children:[
        {id:'logs-daemon', title:'Daemon Logs'},
        {id:'logs-docker', title:'Docker Logs'},
        {id:'logs-gui', title:'GUI Logs'},
      ]},
      {id:'testing-daemon-troubleshooting', title:'Daemon Troubleshooting'},
      {id:'testing-docker-troubleshooting', title:'Docker Troubleshooting'},
      {id:'testing-network-troubleshooting', title:'Network Interface Troubleshooting'},
    ]},
  ];

  async function loadPage(id) {
        try {
            const response = await fetch(`docs/${id}.md`);
            if (!response.ok)
                throw new Error("Missing page");
            return await response.text();
        } catch {
            return `# Page Not Found
    This page has not been written yet.
    `;
        }
    }

    async function buildContentIndex(){
        await Promise.all(
            FLAT.map(async entry => {
                const markdown = await loadPage(entry.id);
    
                CONTENT_INDEX[entry.id] = {
                    title: entry.title.toLowerCase(),
                    content: markdown.toLowerCase()
                };
            })
        );
    }
  
  /* ===================== HELPERS: flatten + numbering ===================== */
  const FLAT = [];       // ordered list of {id, node, path:[ids], depth, number}
  const BY_ID = {};
  const CONTENT_INDEX = {};
  
  function flatten(nodes, path, numPrefix){
    nodes.forEach((node, i) => {
      const number = numPrefix ? `${numPrefix}.${i+1}` : `${i+1}`;
      const entry = {id: node.id, title: node.title, path: [...path, node.id], depth: path.length, number, hasChildren: !!(node.children && node.children.length)};
      FLAT.push(entry);
      BY_ID[node.id] = entry;
      if(node.children) flatten(node.children, entry.path, number);
    });
  }
  flatten(TREE, [], '');
  
  function titleFor(id){ return BY_ID[id] ? BY_ID[id].title : id; }
  
  /* ===================== SIDEBAR RENDER ===================== */
  const treeEl = document.getElementById('tree');
  
  function renderNodes(nodes, path, numPrefix, container){
    nodes.forEach((node, i) => {
      const number = numPrefix ? `${numPrefix}.${i+1}` : `${i+1}`;
      const wrap = document.createElement('div');
      wrap.className = 'node';
  
      const row = document.createElement('div');
      row.className = 'node-row';
      row.dataset.id = node.id;
  
      const hasKids = node.children && node.children.length;
      if(hasKids){
        const t = document.createElement('span');
        t.className = 'toggle';
        t.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        row.appendChild(t);
      } else {
        const spacer = document.createElement('span');
        spacer.className = 'no-toggle';
        row.appendChild(spacer);
      }
  
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = number;
      row.appendChild(num);
  
      const ttl = document.createElement('span');
      ttl.className = 'node-title';
      ttl.textContent = node.title;
      row.appendChild(ttl);
  
      wrap.appendChild(row);
  
      let childWrap;
      if(hasKids){
        childWrap = document.createElement('div');
        // open top lvl
        childWrap.className = path.length === 0 ? 'children open' : 'children';
        renderNodes(node.children, [...path, node.id], number, childWrap);
        wrap.appendChild(childWrap);
      }
  
      row.addEventListener('click', (e) => {
        if(hasKids){
          childWrap.classList.toggle('open');
          row.querySelector('.toggle').classList.toggle('open');
        }
        navigate(node.id);
        closeSidebarOnMobile();
      });
  
      container.appendChild(wrap);
    });
  }
  renderNodes(TREE, [], '', treeEl);
  
  function expandAncestors(id){
    const entry = BY_ID[id];
    if(!entry) return;
    // Only force open strict ancestors, not the node's own children —
    // otherwise re-navigating to the same node (e.g. a toggle click) undoes a manual collapse.
    entry.path.slice(0, -1).forEach(pid => {
      const row = treeEl.querySelector(`.node-row[data-id="${pid}"]`);
      if(row){
        const parentNode = row.closest('.node');
        const kids = parentNode.querySelector(':scope > .children');
        if(kids){
          kids.classList.add('open');
          row.querySelector('.toggle')?.classList.add('open');
        }
      }
    });
  }
  
  function setActive(id){
    treeEl.querySelectorAll('.node-row').forEach(r => r.classList.remove('active'));
    const row = treeEl.querySelector(`.node-row[data-id="${id}"]`);
    if(row){
      row.classList.add('active');
      row.scrollIntoView({block:'nearest'});
    }
  }
  
  /* ===================== SEARCH ===================== */
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    treeEl.querySelectorAll('.node').forEach(nodeEl => {
      filterNode(nodeEl, q);
    });
  });
  
  function filterNode(nodeEl, q){
    const row = nodeEl.querySelector(':scope > .node-row');
    const id = row.dataset.id;
  
    const title = row
      .querySelector('.node-title')
      .textContent
      .toLowerCase();
  
    const content = CONTENT_INDEX[id]?.content || '';
  
    const childWrap = nodeEl.querySelector(':scope > .children');
    let childMatch = false;
  
    if(childWrap){
      childWrap.querySelectorAll(':scope > .node').forEach(child => {
        if(filterNode(child, q)) childMatch = true;
      });
    }
  
    const selfMatch =
      !q ||
      title.includes(q) ||
      content.includes(q);
  
    const show = selfMatch || childMatch;
  
    nodeEl.classList.toggle('hidden-by-search', !show);
  
    if(q && childMatch && childWrap){
      childWrap.classList.add('open');
      row.querySelector('.toggle')?.classList.add('open');
    }
  
    return show;
  }
  
  /* ===================== PAGE RENDER ===================== */
  const pageEl = document.getElementById('page');
  
  function breadcrumbsHtml(entry){
    const parts = entry.path.map((pid, i) => {
      const isLast = i === entry.path.length - 1;
      const label = titleFor(pid);
      if(isLast) return `<span class="crumb-current">${label}</span>`;
      return `<a href="#${pid}">${label}</a><span class="sep">›</span>`;
    });
    return parts.join('');
  }

    async function render(id) {
        const entry = BY_ID[id] || FLAT[0];

        const idx = FLAT.findIndex(f => f.id === entry.id);
        const prev = FLAT[idx - 1];
        const next = FLAT[idx + 1];
        
        const markdown = await loadPage(entry.id);

        marked.use({
            extensions: [{
                name: 'callout',
                level: 'block',
                start(src) {
                    return src.indexOf('> [!');
                },
                tokenizer(src) {
                    const rule = /^>\s*\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\]\s*\n((?:>.*\n?)*)/;
        
                    const match = rule.exec(src);
                    if (match) {
                        const type = match[1].toLowerCase();
        
                        const text = match[2]
                            .replace(/^>\s?/gm, '')
                            .trim();
        
                        return {
                            type: 'callout',
                            raw: match[0],
                            typeName: type,
                            text
                        };
                    }
                },
                renderer(token) {
                    return `
                        <div class="callout callout-${token.typeName}">
                            <div class="callout-title">
                                ${token.typeName}
                            </div>
                            <div class="callout-body">
                                ${marked.parse(token.text)}
                            </div>
                        </div>
                    `;
                }
            }]
        });

        const html = marked.parse(markdown);
        pageEl.innerHTML = `
            <div class="breadcrumbs">
                ${breadcrumbsHtml(entry)}
            </div>
            <span class="pagenum">${entry.number}</span>
            ${html}
            <div class="pagefoot">
                ${prev ?
                    `<a class="prev" href="#${prev.id}">
                        <span class="dir">← Previous</span>
                        <span class="ttl">${prev.title}</span>
                    </a>`
                    : "<span></span>"
                }

                ${next ?
                    `<a class="next" href="#${next.id}">
                        <span class="dir">Next →</span>
                        <span class="ttl">${next.title}</span>
                    </a>`
                    : ""
                }
            </div>
        `;
        setActive(entry.id);
        expandAncestors(entry.id);
        window.scrollTo({top:0});
    }
  
  function navigate(id){
    if(location.hash.slice(1) === id){
      render(id);
    } else {
      location.hash = id;
    }
  }
  
  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1) || FLAT[0].id;
    render(id);
  });
  
  /* ===================== MOBILE SIDEBAR ===================== */
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  document.getElementById('menuBtn').addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  });
  overlay.addEventListener('click', closeSidebarOnMobile);
  function closeSidebarOnMobile(){
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }
  
  /* ===================== INIT ===================== */
  const initialId = location.hash.slice(1) || 'about';

  buildContentIndex().then(() => {
      render(initialId);
      expandAncestors(initialId);
  });