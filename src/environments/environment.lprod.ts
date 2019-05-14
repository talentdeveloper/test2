export const environment = {
  production: true,
  syncGateway: {
    publicURL: 'https://syncgw.in2lolympus.com',
    websocketURL: 'wss://syncgw.in2lolympus.com',
    password: 'in2luser'
  },
  portal: {
    apiURL: 'https://api.in2lolympus.com'
  },
  connectApi: {
    url: 'http://localhost:3000',
    apiKey: '73mP6hMQ7M3OFAa8lVett8WnYoGp1MsY1Spe0DSS'
  },
  google: {
    analytics: {
      ua: 'UA-97566542-2' // prod ua id
    }
  },
  bucketPolicy: {
    fields: {
      acl: 'public-read',
      'Content-Type': '',
      key: '',
      bucket: 'in2l-prod',
      'x-amz-algorithm': 'AWS4-HMAC-SHA256',
      'x-amz-credential': 'AKIAJQKY7QJL6AUFJBGA/20200516/us-east-1/s3/aws4_request',
      'x-amz-date': '20200516T023643Z',
      policy:
        // tslint:disable-next-line:max-line-length
        'eyJleHBpcmF0aW9uIjoiMjAyMC0wNS0xNlQwMjozNjo0My44NjRaIiwiY29uZGl0aW9ucyI6W3siYWNsIjoicHVibGljLXJlYWQifSxbInN0YXJ0cy13aXRoIiwiJENvbnRlbnQtVHlwZSIsIiJdLFsic3RhcnRzLXdpdGgiLCIka2V5IiwiIl0seyJidWNrZXQiOiJpbjJsLXByb2QifSx7IngtYW16LWFsZ29yaXRobSI6IkFXUzQtSE1BQy1TSEEyNTYifSx7IngtYW16LWNyZWRlbnRpYWwiOiJBS0lBSlFLWTdRSkw2QVVGSkJHQS8yMDIwMDUxNi91cy1lYXN0LTEvczMvYXdzNF9yZXF1ZXN0In0seyJ4LWFtei1kYXRlIjoiMjAyMDA1MTZUMDIzNjQzWiJ9XX0=',
      'x-amz-signature': '8b715ccdb5801cf0cc582fce3bbb656413cddb098a54b0c0434909ef06a84694'
    },
    host: 'https://in2l-prod.s3.dualstack.us-east-1.amazonaws.com',
    starts_with: [{ 'Content-Type': '' }, { key: '' }]
  }
};
