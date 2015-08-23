getCurrentTabUrl(function(url){
  ajaxGet(
    'https://hn.algolia.com/api/v1/search',
    {
      hitsPerPage: 5,
      restrictSearchableAttributes: 'url',
      query: url
    },
    function(data){
      document.getElementById('loading').classList.add('hidden');
      if(!data.hits.length){
        document.getElementById('noHits').classList.remove('hidden');
      } else{
        document.querySelector('table').classList.remove('hidden');
        var target = document.getElementById('hits');
        data.hits.forEach(function(hit){
          if(hit.title){
            var dateArray = hit.created_at.split('T');
            var timeArray = dateArray[1].split(':');
            var row = createRow({
              title: hit.title,
              url: 'https://news.ycombinator.com/item?id=' + hit.objectID,
              date: dateArray[0] + ' ' + timeArray[0] + ':' + timeArray[1],
              author: hit.author,
              nbrOfComments: hit.num_comments,
            });

            target.appendChild(row);
          }
        });
      }
    }
  );
});

function createRow(data){
  var row = document.createElement('tr');
  row.appendChild(createLinkButtonTd(data.url, data.text, data.title));
  row.appendChild(createTd(data.author));
  row.appendChild(createTd(data.date));
  row.appendChild(createTd(data.nbrOfComments));
  return row;
}

function createLinkButtonTd(url, text, title){
  var td = document.createElement('td');
  td.onclick = function(){
    window.open(url);
  };
  var text = document.createTextNode(title);
  td.appendChild(text);
  return td;
}

function createTd(content){
  var td = document.createElement('td');
  var text = document.createTextNode(content);
  td.appendChild(text);
  return td;
}

function getCurrentTabUrl(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    callback(tabs[0].url);
  });
}

function ajaxGet(url, data, callback){
  var x = new XMLHttpRequest();
  x.open('GET', url + serialize(data), true);
  x.onreadystatechange = function() {
      if (x.readyState == 4) {
          callback(JSON.parse(x.responseText));
      }
  };
  x.send(data);
}

function serialize(obj) {
  return '?'+Object.keys(obj).reduce(function(a,k){a.push(k+'='+encodeURIComponent(obj[k]));return a},[]).join('&');
}
