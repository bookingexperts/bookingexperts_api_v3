const widdershins = require('widdershins');
const fs = require('fs');

const options = {
  codeSamples: true,
  //headings: 2,
  //shallowSchemas: true,
  //schema: false,
  //resolve: true,
  source: 'https://api.bookingexperts.nl',
  tocSummary: true,
  //expandBody: false,
  //useBodyName: true,
  httpsnippet: true,
  //verbose: false,
  search: false,
  //omitBody: false,
  //discovery: true,
  //raw: false,
  //experimental: true,
  sample: true,
  user_templates: './widdershins_templates/openapi3/',
  includes: [
    'release_notes'
  ],
  toc_footers: [
    {
      url: 'https://www.bookingexperts.nl',
      description: 'Booking Experts'
    }
  ],
  yaml: true
};

// Pet store example (basic swagger example)
//const url = 'https://petstore3.swagger.io/api/v3/openapi.json'
//const http = require('https');

// Production
//const url = 'https://api.bookingexperts.nl/v3/oas3.json'
//const http = require('https');

// Development
const url = 'http://api.lvh.me:3000/v3/oas3.json' // development
const http = require('http');

http.get(url, (resp) => {
  let data = '';
  resp.on('data', (chunk) => {
    data += chunk;
  });
  resp.on('end', () => {
    json = JSON.parse(data)
    widdershins.convert(json, options)
      .then(markdownOutput => {
        fs.writeFileSync('./source/index.html.md', markdownOutput, 'utf8');
      })
      .catch(err => {
        console.error(err);
      });
  });
})
