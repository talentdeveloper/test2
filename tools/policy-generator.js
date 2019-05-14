const policyGenerator = require('s3-post-policy');

const bucket = process.argv[2];
const accessKey = process.argv[3];
const secretKey = process.argv[4];

const date = (new Date().setFullYear(new Date().getFullYear() + 3));

console.log(JSON.stringify(policyGenerator({
  id: accessKey,
  secret: secretKey,
  date: date,
  region: 'us-east-1',
  bucket: bucket,
  policy: {
    expiration: date,
    conditions: [
      {'acl': 'public-read'},
      // upload anything
      ['starts-with', '$Content-Type', ''],
      // to any directory
      ['starts-with', '$key', ''],
      //['starts-with', '$x-amz-meta-tag', ''],
      //{'x-amz-meta-uuid': '14365123651274'}
    ]
  }
})));