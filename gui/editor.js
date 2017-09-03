let progress = {
  start: () => {
    document.querySelector('.progress').style.display = 'block';
  },
  stop: () => {
    document.querySelector('.progress').style.display = 'none';
  }
};

let timeout = 1000;

let loadEditor = (page) => {
  progress.start();
  $.post('/schema', { page: page }).done((data) => {
    setTimeout(() => {
      progress.stop();
      JSONEditor.defaults.editors.object.options.collapsed = true;
      document.getElementById('json-editor').innerHTML = '';
      window.editor = new JSONEditor(document.getElementById('json-editor'), { schema: data.schema });
      window.editor.setValue(preType(JSON.parse(data.data)));
      let iframe = document.querySelector('iframe.preview');
      iframe.src = `http://${window.location.hostname}:80${page}`;
      // Listen for changes
      setTimeout(() => {
        window.editor.on('change',  () => {
          progress.start();
          $.post('/write', { page: page, data: postType(JSON.parse(JSON.stringify(window.editor.getValue()))) }).done((data) => {
            setTimeout(() => {
              iframe.src = iframe.src;
              progress.stop();
            }, timeout);
          });
        });
      }, timeout);
    }, timeout);
  });
}

$.ajax('/pages').done((pages) => {
  window.pages = Object.assign({}, pages);
  for(var p in pages) {
    if(pages.hasOwnProperty(p))
        pages[p] = null;
  };
  $('input.autocomplete').autocomplete({
    data: pages,
    onAutocomplete: loadEditor
  });
  $('input.autocomplete').val('/');
  loadEditor(Object.keys(pages)[0]);
});

function preType(data) {
  // convert [{ type: 'sometype', data: { foo: 1, bar: 2}]
  // to      [{ foo: 1, bar: 2, &type: 'sometype' }]
  Object.entries(data).forEach(([key, value]) => {
    if(typeof value === 'object') {
      data[key] = preType(value);
    } else if(value instanceof Array) {
      value.forEach(preType);
    }
    if(key === 'data') {
      let type = data['type'];
      data = typeof data[key] === 'string' ? { value: data[key] } : Object.assign({}, data[key]);
      data['&type'] = type;
    }
  });

  return data;
}

function postType(data) {
  // convert [{ foo: 1, bar: 2, &type: 'sometype' }]
  // to      [{ type: 'sometype', data: { foo: 1, bar: 2}]
  Object.entries(data).forEach(([key, value]) => {
    if(typeof value === 'object') {
      data[key] = postType(value);
    } else if(value instanceof Array) {
      value.forEach(postType);
    }
    if(key === '&type') {
      data = {
        type: data[key],
        data: data.value ? data.value : Object.assign({}, data)
      };
      delete data.data['&type'];
    }
  });

  return data;
}
