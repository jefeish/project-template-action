const { Octokit } = require("@octokit/action");

async function run() {
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

run();
