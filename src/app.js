let show = elem => elem.classList.remove('hidden');
let hide = elem => elem.classList.add('hidden');let log = d => {console.log(d); return d;}
let serialize = obj => '?'+Object.keys(obj).reduce((a,k)=>{a.push(k+'='+encodeURIComponent(obj[k]));return a},[]).join('&');
let ajaxGet = url => {
  return new Promise(resolve => {
    var x = new XMLHttpRequest();
    x.open('GET', url, true);
    x.onreadystatechange = () => {
        if (x.readyState == 4) {
            resolve(JSON.parse(x.responseText));
        }
    };
    x.send();
  })
}
let toDateString = date => (new Date(date)).toUTCString();
let flatten = (prev, curr) => prev.concat(curr);

let createNode = (tag, children, onclick) => {
  var node = document.createElement(tag);
  if(Array.isArray(children)) {
    children.forEach(c => node.appendChild(c));
  } else {
    node.appendChild(document.createTextNode(children));
  }
  node.onclick = onclick;
  return node;
}

let createStyles = () => createNode('style', `
  body{
    font-family: Verdana, Geneva, sans-serif;
    margin: 5px;
    background-color: rgb(246, 246, 239);
  }
  table{
    border-collapse: collapse;
  }
  tr:first-of-type{
    background-color: transparent;
  }
  tr:first-of-type > td {
    color: black;
  }
  td{
    padding: 4px;
    white-space: nowrap;
    color: rgb(130, 130, 130);
  }
  td:first-of-type{
    color: black;
    cursor: pointer;
    max-width: 20em;
    width: 20em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  td:first-of-type:hover{
    text-decoration: underline;
  }
  .hidden{
    display: none;
  }
  .HackerNews td:first-of-type {
    border-left: 4px solid rgb(255, 102, 0);
  }
  .Reddit td:first-of-type {
    border-left: 4px solid rgb(95,153,207);
  }
`);

let createLoadingIcon = () => {
  let loadingIcon = createNode('div');
  loadingIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <circle transform="translate(8 0)" cx="0" cy="16" r="0" fill="rgb(255, 102, 0)">
        <animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0"
          keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" />
      </circle>
      <circle transform="translate(16 0)" cx="0" cy="16" r="0" fill="rgb(130, 130, 130)">
        <animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0.3"
          keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" />
      </circle>
      <circle transform="translate(24 0)" cx="0" cy="16" r="0" fill="rgb(95,153,207)">
        <animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0.6"
          keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" />
      </circle>
    </svg>
  `;
  return loadingIcon;
}

let createTable = () => createNode('table', [
  createNode('tr', [
    createNode('td', ''),
    createNode('td', 'Author'),
    createNode('td', 'Date'),
    createNode('td', '# Comments'),
  ])
]);

let createRow = data => createNode('tr', [
  createLinkButtonTd(data.url, data.title),
  createNode('td', data.author),
  createNode('td', data.date),
  createNode('td', data.nbrOfComments)
]);

let createLinkButtonTd = (url, title) => {
  let node = createNode('td', title, () => window.open(url));
  node.setAttribute('title', title);
  return node;
}

let getCurrentTabUrl = () =>
  new Promise((resolve, reject) => window.chrome ?
    chrome.tabs.query({ active: true, currentWindow: true }, ([{url}]) => resolve(url)) :
    resolve(window.location.href))

let processProviderResults = ({name}, rows) => {
  if(!rows.length) {
    let noHits = createNode('tr', [
      createNode('td', 'No hits on ' + name),
      createNode('td', '-'),
      createNode('td', '-'),
      createNode('td', '-')
    ]);
    noHits.classList.add(name);
    return [noHits];
  } else{
    return rows
      .sort((a, b) => a.nbrOfComments > b.nbrOfComments ? -1 : 1)
      .filter((row, i) => i < 3)
      .map(createRow)
      .map(c => {
        c.classList.add(name);
        return c;
      });
  }
};

let providers = [
  {
    name: 'HackerNews',
    search: query =>
      ajaxGet('https://hn.algolia.com/api/v1/search' + serialize({hitsPerPage: 5, restrictSearchableAttributes: 'url', query}))
        .then(({hits}) => hits.filter(hit => hit.title).map(hit => ({
          title: hit.title,
          date: toDateString(hit.created_at),
          url: 'https://news.ycombinator.com/item?id=' + hit.objectID,
          author: hit.author,
          nbrOfComments: hit.num_comments
        })))
  },
  {
    name: 'Reddit',
    search: q => ajaxGet(`https://www.reddit.com/r/programming/search.json` + serialize({sort: 'comment', q}))
      .then(d => d && d.data ? d.data.children : [])
      .then(hits => hits.map(d => d.data).map(hit => ({
        title: hit.title,
        date: toDateString(hit.created_utc * 1000),
        url: 'https://reddit.com' + hit.permalink,
        author: hit.author,
        nbrOfComments: hit.num_comments
      })))
  }
];

let init = () => {
  let styles = createStyles();
  document.head.appendChild(styles);
  let loadingIcon = createLoadingIcon();
  document.body.appendChild(loadingIcon);

  getCurrentTabUrl()
    .then(url => Promise.all(providers.map(s => s.search(url))))
    .then(results => {
      hide(loadingIcon);
      let table = createTable();
      providers
        .map((provider, i) => processProviderResults(provider, results[i], table))
        .reduce(flatten, [])
        .map(log)
        .forEach(r => table.appendChild(r));
      document.body.appendChild(table);
    });
}

init();
