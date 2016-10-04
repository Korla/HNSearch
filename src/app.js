let log = d => {console.log(d); return d;}
let removeChild = (container, query) => {
  let elem = container.querySelector(query);
  if(elem) container.removeChild(elem);
}
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
let toDateString = date => (new Date(date)).toLocaleDateString();
let flatten = (prev, curr) => prev.concat(curr);
let zip = (a,b) => a.map((e, i) => [e, b[i]]);

let n = (tagExpr, children = [], onclick) => {
  let [tag, ...classes] = tagExpr.split('.');
  let node = document.createElement(tag);
  node.classList.add(...classes);
  if(Array.isArray(children)) {
    children.forEach(c => node.appendChild(c));
  } else {
    node.appendChild(document.createTextNode(children));
  }
  node.onclick = onclick;
  return node;
}

let createStyles = () => n('style', `
  .commentThreadFinderOsx,
  .commentThreadFinder,
  .commentThreadFinder * {
    all: initial;
    font-family: Verdana, Geneva, sans-serif !important;
    color: grey !important;
    white-space: nowrap !important;
    line-height: 1.2 !important;
  }
  .commentThreadFinderOsx {
    position: fixed !important;
    top: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    z-index: 99999999 !important;
  }
  .commentThreadFinderOsx .commentThreadFinder {
    padding: 5px !important;
    background-color: white !important;
    max-width: 90% !important;
    z-index: 9999999999 !important;
  }
  .commentThreadFinderOsx .cancel {
    position: absolute !important;
    top: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    background-color: rgba(1,1,1,0.7);
    z-index: 999999999 !important;
  }
  .commentThreadFinder > * {
    padding: 2px 0;
    cursor: pointer !important;
  }
  .commentThreadFinder div {
    display: block !important;
  }
  .commentThreadFinder > *:hover .title {
    text-decoration: underline !important;
  }
  .commentThreadFinder .title {
    font-size: 12px !important;
    max-width: 30em !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    cursor: pointer !important;
  }
  .commentThreadFinder .content {
    position: relative !important;
    display: flex !important;
    justify-content: space-between !important;
    cursor: pointer !important;
  }
  .commentThreadFinder .content > * {
    max-width: 10em !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    display: inline-block !important;
    font-size: 10px !important;
    cursor: pointer !important;
  }
  .commentThreadFinder .hidden {
    display: none !important;
  }
  .commentThreadFinder .HackerNews .title {
    color: rgb(255, 102, 0) !important;
  }
  .commentThreadFinder .Reddit .title {
    color: rgb(95,153,207) !important;
  }

  .commentThreadFinder circle {
    fill: rgb(130, 130, 130);
    cy: 16px;
  }
  .commentThreadFinder circle:first-child {
    fill: rgb(255, 102, 0);
  }
  .commentThreadFinder circle:last-child {
    fill: rgb(95,153,207)
  }
`);

let createLoadingIcon = container => {
  container.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <circle transform="translate(8 0)" cx="0" r="0">
        <animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0"
          keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" />
      </circle>
      <circle transform="translate(16 0)" cx="0" r="0">
        <animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0.3"
          keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" />
      </circle>
      <circle transform="translate(24 0)" cx="0" r="0">
        <animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0.6"
          keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" />
      </circle>
    </svg>
  `;
}

let createContainer = () => n('div.commentThreadFinder');

let hide = () => undefined;
let createRow = name => data => n('div.' + name, [
  n('div.title', data.title),
  n('div.content', [
    n('span.author', data.author),
    n('span', data.date),
    n('span.nbrOfComments', data.nbrOfComments + ' comments')
  ])
], () => {
  window.open(data.url);
  hide();
});

let createNoHits = name => n('div', 'No hits found.');

let getCurrentTabUrl = () =>
  new Promise((resolve, reject) => chrome.tabs.query({ active: true, currentWindow: true }, ([{url}]) => resolve(url)))

let processProviderResults = ({provider, response}) => {
  if(!provider) return [];
  return provider.createRows(response)
    .sort((a, b) => a.nbrOfComments > b.nbrOfComments ? -1 : 1)
    .filter((row, i) => i < 3)
    .map(createRow(provider.name));
};

let providers = [
  {
    name: 'Reddit',
    getUrl: q => `https://www.reddit.com/r/programming/search.json` + serialize({sort: 'comment', q}),
    createRows: r => r.data.children.map(d => d.data).map(hit => ({
      title: hit.title,
      date: toDateString(hit.created_utc * 1000),
      url: 'https://reddit.com' + hit.permalink,
      author: hit.author,
      nbrOfComments: hit.num_comments
    })),
    matchingResponse: r => r.kind === 'Listing' && r.data
  },
  {
    name: 'HackerNews',
    getUrl: query => 'https://hn.algolia.com/api/v1/search' + serialize({hitsPerPage: 5, restrictSearchableAttributes: 'url', query}),
    createRows: ({hits}) => hits.filter(hit => hit.title).map(hit => ({
      title: hit.title,
      date: toDateString(hit.created_at),
      url: 'https://news.ycombinator.com/item?id=' + hit.objectID,
      author: hit.author,
      nbrOfComments: hit.num_comments
    })),
    matchingResponse: r => r.hits
  }
];

let processResponse = ({container}) => responses => {
  removeChild(container, 'svg');
  let responseAndProvider = response => ({response, provider: providers.find(p => p.matchingResponse(response))});
  let responsePerProvider = responses.map(responseAndProvider);
  let rowsPerProvider = responsePerProvider.map(processProviderResults)
  let allRows = rowsPerProvider.reduce(flatten, []);
  if(allRows.length === 0) allRows.push(createNoHits());
  allRows.forEach(r => container.appendChild(r));
}

let createGui = outer => {
  let styles = createStyles();
  document.head.appendChild(styles);
  let container = createContainer();
  createLoadingIcon(container);
  outer.appendChild(container);
  return {container};
}

if(window.chrome) {
  let elements = createGui(document.body);
  getCurrentTabUrl()
    .then(query => Promise.all(providers.map(s => ajaxGet(s.getUrl(query)))))
    .then(processResponse(elements));
} else {
  let Extension = function(){};
  hide = () => removeChild(document.body, '.commentThreadFinderOsx');
  Extension.prototype = {
    run: function({completionFunction}) {
      hide();
      let outer = n('div.commentThreadFinderOsx', [
        n('div.cancel', [], () => hide())
      ]);
      document.body.appendChild(outer);
      this.elements = createGui(outer);
      completionFunction({ providers: providers.map(p => p.getUrl(window.location.href)) });
    },
    finalize: function({response}) {
      processResponse(this.elements)(response.split('||||').map(JSON.parse));
    }
  }

  window.ExtensionPreprocessingJS = new Extension;
}
