const keva = require('keva');

module.exports = (name, json) => {
  let schema = {
    definitions: {},
    title: name,
    type: 'object',
    properties: json
  };
  schema.properties = convert(schema.properties, schema.definitions);
  return schema;
}

function convert(data, definitions) {
  for(let [key, value] of keva(data)) {
    if(typeof value === 'string') {
      data[key] = {
        type: 'string'
      };
    } else if(value instanceof Array) {
      let distinctTypes = new Set();
      data[key] = {
        title: key,
        type: 'array',
        items: {
          anyOf: []
        }
      };
      value.forEach((element) => {
        if(typeof element.data === 'string') {
          element.data = {
            value: element.data
          };
        }
        if(!definitions[element.type]) {
          distinctTypes.add(element.type);
          definitions[element.type] = {
            title: element.type,
            type: 'object',
            additionalProperties: false,
            properties: convert(element.data, definitions)
          };
          definitions[element.type].properties['&type'] = {
            type: 'string'
          };
        }
      });
      for(let item of distinctTypes) {
        data[key].items.anyOf.push({
          '$ref': `#/definitions/${item}`
        });
      }
    } else {
      data[key] = {
        title: key,
        type: 'object',
        properties: convert(value, definitions)
      }
    }
  }
  return data;
};
