/**
 * @description GitHub action to build Project Boards from template Yaml files.
 * This action strictly uses templates to create all of it's components. 
 * Project board `Issues` as well as `Cards`, must be based on a 
 * `.github/ISSUE_TEMPLATE`.
 * 
 * @author jefeish@github.com
 * @license MIT
 */

const core = require('@actions/core');
const github = require('@actions/github');

const fs = require('fs');
const yaml = require('js-yaml')
const util = require('util')

// ----------------------------------------------------------------------------

const projectTemplatePath = './.github/PROJECT_TEMPLATE'
const issueTemplatePath = './.github/ISSUE_TEMPLATE'
const templateName = 'project-1'
let owner = ''
let repo = ''
let octokit

/**
 * @description Retrieve templates for type of: 'projects', 'Issues' or 'Cards'
 * @param {*} templatePath 
 * @param {*} templateName 
 * @param {*} templateType 
 * @returns 
 */
function getTemplate(templatePath, templateName, templateType) {
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
            throw new Error('No valid templateType was provided (' + templateType + ') - Valid types: [ project | Card | Issue ]')
    }
    return template
}

/**
 * @description Create a Project Card or Issue, based on ISSUE_TEMPLATE(s)
 * @param {*} columnId 
 * @param {*} issueTemplate 
 * @param {*} type 
 * @param {*} parameters 
 * @param {*} milestoneNumber 
 * @returns 
 */
async function createProjectCard(columnId, issueTemplate, type, parameters, milestoneNumber) {
    let issueBody = ''
    const lineRegex = '/^-.-$/g'
    const nameRegex = /name:.*/g
    const aboutRegex = /about:.*/g
    const titleRegex = /title:.*/g
    const labelRegex = /label:.*/g
    const assigneesRegex = /assignees:.*/g

    try {
        if (type == 'Issue') {

            // Substitute parameters
            if (parameters) {
                for (const [key, value] of Object.entries(parameters)) {
                    issueTemplate = String(issueTemplate).replaceAll("{{" + key + "}}", value)
                }
            }

            // Extract template headers
            const name = (String(String(issueTemplate).match(nameRegex))).split(':')[1].trim()
            const about = (String(String(issueTemplate).match(aboutRegex))).split(':')[1].trim()
            const title = (String(String(issueTemplate).match(titleRegex))).split(':')[1].trim()
            const labels = (String(String(issueTemplate).match(labelRegex))).split(':')[1].trim().split(',')
            const assignees = (String(String(issueTemplate).match(assigneesRegex))).split(':')[1].trim().split(',')

            // Delete template headers (poorman's version)
            const template1 = String(issueTemplate).replace(lineRegex, '')
            const template2 = String(template1).replace(nameRegex, '')
            const template3 = String(template2).replace(nameRegex, '')
            const template4 = String(template3).replace(aboutRegex, '')
            const template5 = String(template4).replace(titleRegex, '')
            const template6 = String(template5).replace(labelRegex, '')
            issueBody = String(template6).replace(assigneesRegex, '')

            // "poor-man's" debugging
            console.log('\n name: ' + util.inspect(name))
            console.log(' about: ' + util.inspect(about))
            console.log(' title: ' + util.inspect(title))
            console.log(' labels: ' + util.inspect(labels))
            console.log(' assignees: ' + util.inspect(assignees))
            console.log('---------------------------------------------')

            // Create the requested labels, ignore the error if they already exist
            labels.forEach(async function (label, index) {
                // pick a random color, otherwise we get grey
                const colors = ['407294', '8b66ff', 'a12b8d', '09a752', 'a7a109', '0fa709', 'a109a7', 'a7090f', '09a7a1', 'ff00ff', 'ffff00', 'ff0000', '0000ff', 'ff0080', 'ffff00', '0001ff', '00ff00', 'ff00ff', 'ff0080', '00ff7f', '7f00ff', '80ff00', 'ff7f00', '0080ff', '00ff80', '00ffff', 'ff000a', '00fff5', 'ff008a', '00ff75', '000bff', '7500ff', 'ff000b', '8aff00', '008aff', 'ff7500', '2bffff', 'ff2b95', '2bff2b', 'ff2b95', '2bff2b', '2b2bff']
                const i = Math.floor(Math.random() * colors.length)
                const color = colors[i]
                // remove the color we just picked, try to prevent same colors for different labels (works as long as we have, labels <= #colors)
                colors.splice(i, 1);

                try {
                    issue = await octokit.rest.issues.createLabel({
                        owner: owner,
                        repo: repo,
                        description: 'auto-generated [' + label + ']',
                        name: label,
                        color: color
                    })
                }
                catch (e) {
                    // console.log(e)
                    console.log('WARN: Creating Label (' + label + ') failed, it probably already exists... continue!')
                }
            })

            issue = await octokit.rest.issues.create({
                owner: owner,
                repo: repo,
                title: title,
                body: issueBody,
                labels: labels,
                assignees: assignees,
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
                    issueTemplate = String(issueTemplate).replaceAll("{{" + key + "}}", value)
                }
            }

            // Delete template headers
            const template1 = String(issueTemplate).replace(nameRegex, '')
            const template2 = String(template1).replace(aboutRegex, '')
            const template3 = String(template2).replace(titleRegex, '')
            const template4 = String(template3).replace(labelRegex, '')
            issueBody = String(template4).replace(assigneesRegex, '')

            card = await octokit.rest.projects.createCard({
                column_id: columnId,
                note: issueBody
            });
        }
    }
    catch (e) {
        console.log(e)
    }
    return card
}

/**
 * @description Create a Milesstone to assing Project Issues to
 * @param {*} milestoneName 
 * @param {*} description 
 * @param {*} dueDate 
 * @returns 
 */
async function createProjectMilestone(milestoneName, description, dueDate) {
    let milestone = ''
    let title = milestoneName + '-Milestone'

    try {
        milestone = await octokit.rest.issues.createMilestone({
            owner: owner,
            repo: repo,
            title: title,
            due_on: dueDate,
            description: description
        });
        return milestone
    }
    catch (e) {
        // console.log(e)
        console.log('WARN: Creating the Milestone ran into a problem, look up and return an existing Milestone')
        const milestoneList = await octokit.rest.issues.listMilestones({
            owner: owner,
            repo: repo
        })

        milestoneList['data'].forEach(async function (mStone, index) {

            if (mStone['title'] == title) {
                milestone = mStone
            }
        })
    }
    return milestone
}

/**
 * @description Create project columns based on the project template (Yaml)
 * @param {*} projectId 
 * @param {*} column 
 * @returns 
 */
async function createProjectColumn(projectId, column) {
    try {
        const col = await octokit.rest.projects.createColumn({
            project_id: projectId,
            name: column['name']
        })
    }
    catch (e) {
        console.log(e)
    }
    return col
}

/**
 * @description Create a project board from a project template (Yaml)
 * @param {*} name 
 * @param {*} body 
 * @returns 
 */
async function createProject(name, body) {
    try {
        const project = await octokit.rest.projects.createForRepo({
            owner: owner,
            repo: repo,
            name: name,
            body: body
        });
    }
    catch (e) {
        console.log(e)
        process.exit(1)
    }
    return project
}

/**
 * @description Entrypoint
 */
async function exec() {
    let token

    try {
        token = core.getInput("GITHUB_TOKEN");
        octokit = github.getOctokit(token)
        // octokit = new github.getOctokit({
        //     auth: token
        // });

        owner = github.context.repo.owner
        repo = github.context.repo.repo

        console.log(' owner: ' + owner + '\n repo: ' + repo)
        console.log('GITHUB_TOKEN: ' + token)

        // Retrieve the project template
        const projectTemplate = getTemplate(projectTemplatePath, templateName, 'project')
        const projects = projectTemplate['projects']

        if (projects) {
            // Iterate over projects
            projects.forEach(async function (prj, index) {
                const project = await createProject(prj['name'], prj['description'])
                const projectId = project['data']['id']
                const columns = prj['columns']
                const milestone = await createProjectMilestone(prj['name'], prj['description'], prj['duedate'])

                if (columns) {
                    // Iterate over columns in project
                    for (let i = 0; i < columns.length; i++) {
                        const projectColumn = await createProjectColumn(projectId, columns[i])
                        const columnId = projectColumn['data']['id']
                        const cards = columns[i]['cards']

                        if (cards) {
                            // Iterate over cards in column
                            cards.forEach(async function (card, index) {
                                const cardTemplateName = card['template']
                                // Retrieve the local issue template
                                const issueTemplate = getTemplate(issueTemplatePath, cardTemplateName, card['type'])
                                const columnCard = await createProjectCard(columnId, issueTemplate, card['type'], card['parameters'], milestone['number'])
                            })
                        }
                    }
                }
            })
        }
    } catch (e) {
        console.log(e)
    }
}

// Entrypoint
exec()