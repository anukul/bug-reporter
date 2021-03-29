const getenv = require('getenv');
const middy = require('@middy/core')
const jsonBodyParser = require('@middy/http-json-body-parser')
const httpErrorHandler = require('@middy/http-error-handler')
const validator = require('@middy/validator')

const { Octokit } = require("@octokit/rest");


const octokit = new Octokit({
  auth: getenv.string('GITHUB_ACCESS_TOKEN')
});

const [owner, repo] = getenv.string('GITHUB_REPOSITORY').split('/');

const reportBug = async (event) => {
  const { body, title } = event.body;
  const response = await octokit.issues.create({
    owner, repo,
    body, title
  });
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
  .use(httpErrorHandler());

module.exports = { handler }
