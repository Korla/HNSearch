let show = elem => elem.classList.remove('hidden');
let hide = elem => elem.classList.add('hidden');
let log = d => {console.log(d); return d;}
let serialize = obj => '?'+Object.keys(obj).reduce((a,k)=>{a.push(k+'='+encodeURIComponent(obj[k]));return a},[]).join('&');
let ajaxGet = url => fetch(url).then(d => d.json());
let toDateString = date => (new Date(date)).toUTCString();

let createNode = (tag, children, text, onclick) => {
  var node = document.createElement(tag);
  children.forEach(c => node.appendChild(c));
  if(text) {
    node.appendChild(document.createTextNode(text));
  }
  node.onclick = onclick;
  return node;
}

let createRow = data => createNode('tr', [
  createLinkButtonTd(data.url, data.title),
  createTd(data.author),
  createTd(data.date),
  createTd(data.nbrOfComments)
]);

let createLinkButtonTd = (url, title) => {
  let node = createNode('td', [], title, () => window.open(url));
  node.setAttribute('title', title);
  return node;
}

let createTd = text => createNode('td', [], text);

let getCurrentTabUrl = () =>
  new Promise((resolve, reject) =>
    chrome.tabs.query({ active: true, currentWindow: true }, ([{url}]) => resolve(url)));

let hn = {
  name: 'HackerNews',
  cssClass: 'HackerNews',
  search: query =>
    ajaxGet('https://hn.algolia.com/api/v1/search' + serialize({ hitsPerPage: 5, restrictSearchableAttributes: 'url', query }))
      .then(({hits}) => hits.filter(hit => hit.title).map(hn.toRowData_)),
  toRowData_: hit => ({
    title: hit.title,
    date: toDateString(hit.created_at),
    url: 'https://news.ycombinator.com/item?id=' + hit.objectID,
    author: hit.author,
    nbrOfComments: hit.num_comments
  })
}

let reddit = {
  name: '/r/Programming',
  cssClass: 'rProgramming',
  search: q => ajaxGet(`https://www.reddit.com/r/programming/search.json` + serialize({sort: 'comment', q}))
    .then(d => d && d.data ? d.data.children : [])
    .then(hits => hits.map(d => d.data).map(reddit.toRowData_)),
  toRowData_: hit => ({
    title: hit.title,
    date: toDateString(hit.created_utc*1000),
    url: 'https://reddit.com' + hit.permalink,
    author: hit.author,
    nbrOfComments: hit.num_comments
  })
}

let searches = [hn, reddit];
let table = document.querySelector('table tbody');

let processResults = ({name, cssClass}, rows) => {
  if(!rows.length){
    let noHits = createNode('tr', [
      createNode('td', [], 'No hits on ' + name),
      createNode('td', [], '-'),
      createNode('td', [], '-'),
      createNode('td', [], '-')
    ]);
    noHits.classList.add(cssClass);
    table.appendChild(noHits);
  } else{
    rows
      .sort((a, b) => a.nbrOfComments > b.nbrOfComments ? -1 : 1)
      .filter((row, i) => i < 3)
      .map(createRow).forEach(c => {
        c.classList.add(cssClass);
        table.appendChild(c);
      });
  }
};

getCurrentTabUrl()
  .then(url => Promise.all(searches.map(s => s.search(url))))
  .then(results => {
    hide(document.querySelector('#loading'));
    searches.forEach((search, i) => processResults(search, results[i]))
  });
