// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=qa` then `environment.qa.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
  production: true,
  syncGateway: {
    publicURL: 'https://syncgw-stg.in2lolympus.com',
    websocketURL: 'wss://syncgw-stg.in2lolympus.com',
    password: 'in2luser'
  },
  portal: {
    apiURL: 'https://api-stg.in2lolympus.com'
  },
  connectApi: {
    url: 'http://localhost:3000',
    apiKey: '73mP6hMQ7M3OFAa8lVett8WnYoGp1MsY1Spe0DSS'
  },
  google: {
    analytics: {
      ua: 'UA-97566542-1' // qa ua id
    }
  },
  bucketPolicy: {
    fields: {
      acl: 'public-read',
      'Content-Type': '',
      key: '',
      bucket: 'in2l-stage',
      'x-amz-algorithm': 'AWS4-HMAC-SHA256',
      'x-amz-credential': 'AKIAJL6BUPZ4MZOV4SAQ/20210102/us-east-1/s3/aws4_request',
      'x-amz-date': '20210102T231343Z',
      policy:
        // tslint:disable-next-line:max-line-length
        'eyJleHBpcmF0aW9uIjoiMjAyMS0wMS0wMlQyMzoxMzo0My4zODNaIiwiY29uZGl0aW9ucyI6W3siYWNsIjoicHVibGljLXJlYWQifSxbInN0YXJ0cy13aXRoIiwiJENvbnRlbnQtVHlwZSIsIiJdLFsic3RhcnRzLXdpdGgiLCIka2V5IiwiIl0seyJidWNrZXQiOiJpbjJsLXN0YWdlIn0seyJ4LWFtei1hbGdvcml0aG0iOiJBV1M0LUhNQUMtU0hBMjU2In0seyJ4LWFtei1jcmVkZW50aWFsIjoiQUtJQUpMNkJVUFo0TVpPVjRTQVEvMjAyMTAxMDIvdXMtZWFzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LHsieC1hbXotZGF0ZSI6IjIwMjEwMTAyVDIzMTM0M1oifV19',
      'x-amz-signature': '2b9fbbc0ea997767bffb5425cdddac3dc102328d8211ea31ec53e065ce8af0b1'
    },
    host: 'https://in2l-stage.s3.dualstack.us-east-1.amazonaws.com',
    starts_with: [{ 'Content-Type': '' }, { key: '' }]
  }
};
