const fs = require('fs');
const github = require('@actions/github')

async function exec() {
    console.log('exec()');
    ret = await getProjectTemplate()
    console.log('ret: '+ret)
}

async function getProjectTemplate() {
    console.log('getProjectTemplate()');
    const repo = github.context.payload.repository.full_name
    console.log(`full name: ${repo}!`)
    // Function to get current filenames
    // in directory
    try {
        fs.readdir(__dirname, (err, files) => {
            if (err)
                console.log(err);
            else {
                console.log("\nCurrent directory filenames:");
                files.forEach(file => {
                    console.log(file);
                })
            }
        })
    } catch (e) {
        throw new Error(e.toString());
    }
}

async function getIssueTemplate() {
    console.log('getIssueTemplate');
}

async function createIssue() {
    const { Octokit } = require("@octokit/action");
    const octokit = new Octokit();
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

    // See https://developer.github.com/v3/issues/#create-an-issue
    const { data } = octokit.issues.create({
        owner,
        repo,
        title: "My test issue",
    });
    console.log("Issue created: %s", data);
}

exec();
