// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=qa` then `environment.qa.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
  production: true,
  syncGateway: {
    publicURL: 'https://syncgw-qa.in2lolympus.com',
    websocketURL: 'wss://syncgw-qa.in2lolympus.com',
    password: 'in2luser'
  },
  portal: {
    apiURL: 'https://api-qa.in2lolympus.com'
  },
  connectApi: {
    url: 'https://awsapi-qa.in2lconnect.com/latest',
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
      bucket: 'in2l-qa',
      'x-amz-algorithm': 'AWS4-HMAC-SHA256',
      'x-amz-credential': 'AKIAJRUQUDOIUW2DZNOA/20200516/us-east-1/s3/aws4_request',
      'x-amz-date': '20200516T023553Z',
      policy:
        // tslint:disable-next-line:max-line-length
        'eyJleHBpcmF0aW9uIjoiMjAyMC0wNS0xNlQwMjozNTo1My41MTNaIiwiY29uZGl0aW9ucyI6W3siYWNsIjoicHVibGljLXJlYWQifSxbInN0YXJ0cy13aXRoIiwiJENvbnRlbnQtVHlwZSIsIiJdLFsic3RhcnRzLXdpdGgiLCIka2V5IiwiIl0seyJidWNrZXQiOiJpbjJsLXFhIn0seyJ4LWFtei1hbGdvcml0aG0iOiJBV1M0LUhNQUMtU0hBMjU2In0seyJ4LWFtei1jcmVkZW50aWFsIjoiQUtJQUpSVVFVRE9JVVcyRFpOT0EvMjAyMDA1MTYvdXMtZWFzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LHsieC1hbXotZGF0ZSI6IjIwMjAwNTE2VDAyMzU1M1oifV19',
      'x-amz-signature': 'e9b1a6fb0be0414464e0d87ba0ef258b902a8463ceccef4b0bca9cb44d512702'
    },
    host: 'https://in2l-qa.s3.dualstack.us-east-1.amazonaws.com',
    starts_with: [{ 'Content-Type': '' }, { key: '' }]
  }
};
