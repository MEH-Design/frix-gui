const keva = require('keva');
const merge = require('deepmerge');

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
      if(!data[key].items) {
        data[key] = {
          title: key,
          type: 'array',
          items: {
            anyOf: []
          }
        };
      }
      value.forEach((element) => {
        if(typeof element.data === 'string') {
          element.data = {
            value: element.data
          };
        }
        let newDefinition = {
          title: element.type,
          type: 'object',
          additionalProperties: false,
          properties: convert(element.data, definitions)
        };
        distinctTypes.add(element.type);
        let concatMerge = (src, dst) => src.concat(dst);
        definitions[element.type] = merge(definitions[element.type] || {}, newDefinition, { arrayMerge: concatMerge });
        definitions[element.type].properties['&type'] = {
          type: 'string',
          default: element.type
        };
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
