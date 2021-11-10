
const fs = require('fs');
const yaml = require('js-yaml')
const util = require('util')
const { Octokit } = require("@octokit/rest");
// const { exit } = require('process');
// const readline = require('readline');

// ----------------------------------------------------------------------------

const projectTemplatePath = './.github/PROJECT_TEMPLATE'
const issueTemplatePath = './.github/ISSUE_TEMPLATE'
const templateName = 'project-1'
let owner = 'jefeish'
let repo = 'migration'

const octokit = new Octokit({
    auth: process.env.PAT
});

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

/**
 * @description Get the template content
 * @param {*} templateName 
 * @returns Project template content
 */
async function getTemplate(templatePath, templateName, templateType) {
    let fullTemplatePath = ''
    let template = ''
    let ext = ''
    
    switch (templateType) {
        case 'project':
            ext = '.yml'
            fullTemplatePath = templatePath + '/' + templateName + ext
            const data = fs.readFileSync(fullTemplatePath, 'utf8');
            template = yaml.load(data);
            break;
        case 'Card':
        case 'Issue':
            ext = '.md'
            fullTemplatePath = templatePath + '/' + templateName + ext
            template = fs.readFileSync(fullTemplatePath, 'utf8');
            break;
        default:
            throw new Error('No valid templateType was provided (' + templateType + ')')
    }

    return template
}

/**
 * @description
 * @param {*} columnId 
 * @param {*} issueTemplate 
 */
async function createProjectCard(columnId, issueTemplate, type, parameters, milestoneNumber) {
    let issueBody = ''
    const lineRegex = '/^-.-$/g'
    const nameRegex = /name:.*/g
    const aboutRegex = /about:.*/g
    const titleRegex = /title:.*/g
    const labelRegex = /label:.*/g
    const assigneesRegex = /assignees:.*/g

    if (type == 'Issue') {
        
        // Substitute parameters
        if (parameters) {
            for (const [key, value] of Object.entries(parameters)) {
                issueTemplate = String(issueTemplate).replaceAll("{{"+ key +"}}", value)
            }
        }

        // Filter template headers
        const name = (String(String(issueTemplate).match(nameRegex))).split(':')[1]
        const about = (String(String(issueTemplate).match(aboutRegex))).split(':')[1]
        const title = (String(String(issueTemplate).match(titleRegex))).split(':')[1]
        const label = (String(String(issueTemplate).match(labelRegex))).split(':')[1]
        const assignees = (String(String(issueTemplate).match(assigneesRegex))).split(':')[1]

        // Delete template headers (poorman's version)
        const template1 = String(issueTemplate).replace(lineRegex, '')
        // console.log('> template1: ' + template1 +'<')
        const template2 = String(template1).replace(nameRegex, '')
        const template3 = String(template2).replace(nameRegex, '')
        const template4 = String(template3).replace(aboutRegex, '')
        const template5 = String(template4).replace(titleRegex, '')
        const template6 = String(template5).replace(labelRegex, '')
        issueBody = String(template6).replace(assigneesRegex, '')

        // console.log('> issueBody: ' + issueBody + '<')
        
        // console.log('> name: ' + name)
        // console.log('> about: ' + about)
        // console.log('> title: ' + title)
        // console.log('> label: ' + label)
        // console.log('> assignees: ' + assignees)

        issue = await octokit.rest.issues.create({
            owner: owner,
            repo: repo,
            title: title,
            body: issueBody,
            milestone: milestoneNumber
        });

        card = await octokit.rest.projects.createCard({
            column_id: columnId,
            content_id: issue['data']['id'],
            content_type: type
          });
    }
    else if (type == 'Card') {
        // Substitute parameters
        if (parameters) {
            for (const [key, value] of Object.entries(parameters)) {
                issueTemplate = String(issueTemplate).replaceAll("{{"+ key +"}}", value)
            }
        }
        
        // Delete template headers
        const template1 = String(issueTemplate).replace(nameRegex, '')
        const template2 = String(template1).replace(aboutRegex,'')
        const template3 = String(template2).replace(titleRegex,'')
        const template4 = String(template3).replace(labelRegex,'')
        issueBody = String(template4).replace(assigneesRegex, '')
        // console.log('issueBody: >' + issueBody +'<')
        
        card = await octokit.rest.projects.createCard({
            column_id: columnId,
            note: issueBody
          });
    }

    // console.log('card: >' + util.inspect(card) +'<')
    return card
}

/**
 * @description Create a Milesstone with Project template Issues assigned
 * @param {*} body 
 * @returns milestone
 */
async function createProjectMilestone(milestoneName, description) {
    let milestone = ''
    let title = milestoneName + '-Milestone'

    try {
        milestone = await octokit.rest.issues.createMilestone({
            owner: owner,
            repo: repo,
            title: title,
            description: description
        });

        return milestone
    }
    catch (e)
    {
        console.log('>'+e+'<')
        const milestoneList = await octokit.rest.issues.listMilestones({
            owner: owner,
            repo: repo
        })

        // console.log(milestoneList['data'])
        
        milestoneList['data'].forEach(async function (mStone, index) {
            // console.log('milestone title:' + mStone['title'])
            // console.log('>' + util.inspect(mStone) + '<')
            
            if (mStone['title'] == title) {
                console.log(mStone['title'] + ':' + mStone['number'])
                milestone = mStone
            }
        })
    }
    return milestone
}

/**
 * @description
 * @param {*} body 
 */
async function createProjectColumn(projectId, column) {

    console.log('name: ' + column['name'])
    console.log('projectId: ' + projectId)

    column = await octokit.rest.projects.createColumn({
        project_id: projectId,
        name: column['name']
    })

    return column
}

/**
 * @description
 * @param {*} body 
 */
async function createProject(name, body) {

    project = await octokit.rest.projects.createForRepo({
        owner: owner,
        repo: repo,
        name: name,
        body: body,
    });

    return project
}

/**
 * @description
 */
async function exec() {
    // Retrieve the local project template
    const projectTemplate = await getTemplate(projectTemplatePath, templateName, 'project')
    const projects = projectTemplate['projects']
    // console.log('>> projects:'+ util.inspect(projects))
    
    if (projects) {
        // Iterate over projects
        projects.forEach(async function (prj, index) {
            const project = await createProject(prj['name'], prj['description'])
            const projectId = project['data']['id']
            // console.log('projectId: ' + project['data']['id'])
            let columns = prj['columns']
            // console.log('>> columns: ' + util.inspect(columns))
            let columnIds = []
            let cardIds = []

            const milestone = await createProjectMilestone(prj['name'], prj['description']) 
            // console.log('milestone: ' + util.inspect(milestone))

            if (columns) {
                // Iterate over columns in project
                columns.forEach(async function (col, index) {
                    // console.log('columns: ' + col['name'])
                    const projectColumn = await createProjectColumn(projectId, col)
                    const columnId = projectColumn['data']['id']
                    // console.log('>> col: ' + util.inspect(col['cards']))
                    columnIds.push(columnId);
                    const cards = col['cards']
                    // console.log('cards: ' + cards)

                    if (cards) {
                        // Iterate over cards in column
                        cards.forEach(async function (card, index) {
                            // console.log('cards: ' + card['name'])
                            const cardTemplateName = card['template']
                            // console.log('cardTemplateName: ' + card['template'])
                            // Retrieve the local issue template
                            const issueTemplate = await getTemplate(issueTemplatePath, cardTemplateName, card['type'])
                            // console.log(util.inspect(issueTemplate))
                            const columnCard = await createProjectCard(columnId, issueTemplate, card['type'], card['parameters'], milestone['number'] )
                            // console.log('columnCard ID: >'+ columnCard['data']['id'] +'<')
                            cardIds.push(columnCard['data']['id']);
                            // console.log('>> card IDs: ' + util.inspect(cardIds))
                        })
                    }
                })
            }
        })
    }
}

exec()