const getenv = require('getenv');
const { Octokit } = require("@octokit/rest");
const AWS = require('aws-sdk');
const { v4: uuid } = require('uuid');

const octokit = new Octokit({
    auth: getenv.string('GITHUB_ACCESS_TOKEN')
});

const [owner, repo] = getenv.string('GITHUB_REPOSITORY').split('/');

// TODO: use environment variable for bucket name
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

const headers = {
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization,X-Api-Key,X-Requested-With,Accept,Access-Control-Allow-Methods,Access-Control-Allow-Origin,Access-Control-Allow-Headers",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
    "X-Requested-With": "*"
}

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {
    try {
        const { body, title } = JSON.parse(event.body);
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
            }),
            headers
        };
    } catch (err) {
        console.log(JSON.stringify(err));
        return {
            statusCode: 500,
            headers
        };
    }
};
