const getenv = require('getenv');
const middy = require('@middy/core')
const jsonBodyParser = require('@middy/http-json-body-parser')
const httpErrorHandler = require('@middy/http-error-handler')
const validator = require('@middy/validator')
const cors = require('@schibsted/middy-cors');
const { Octokit } = require("@octokit/rest");
const AWS = require('aws-sdk');
const { v4: uuid } = require('uuid');


const octokit = new Octokit({
  auth: getenv.string('GITHUB_ACCESS_TOKEN')
});

const [owner, repo] = getenv.string('GITHUB_REPOSITORY').split('/');

const screenshotBucket = new AWS.S3({ params: { Bucket: 'bug-reporter-screenshots' } });
const screenshotBucketURL = 'https://bug-reporter-screenshots.s3.ap-south-1.amazonaws.com'

const uploadBase64ToS3 = async (base64) => {
  const buf = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
  const imageKey = uuid();
  const data = {
    Key: imageKey,
    Body: buf,
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg'
  }
  await screenshotBucket.putObject(data).promise();
  return `${screenshotBucketURL}/${imageKey}`
}

const convertImageURL = async (body) => {
  const base64URLRegex = /\[screenshot\]\((.*)\)/;
  const base64URL = base64URLRegex.exec(body)[1];
  const s3URL = await uploadBase64ToS3(base64URL);
  return body.replace(base64URL, s3URL);
}

const reportBug = async (event) => {
  const { body, title } = event.body;
  const bodyWithImage = await convertImageURL(body);
  const response = await octokit.issues.create({
    owner,
    repo,
    body: bodyWithImage,
    title
  });
  // TODO: delete image from S3 after issue is created
  return {
    statusCode: 200,
    body: JSON.stringify({
      issue_url: response.data.html_url
    })
  };
};

const inputSchema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['title']
    }
  }
};

const handler = middy(reportBug)
  .use(jsonBodyParser())
  .use(validator({inputSchema}))
  .use(httpErrorHandler())
  .use(cors());

module.exports = { handler }
