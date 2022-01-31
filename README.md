# project-template-action

GitHub action to create Project Boards from template Yaml files.

This **Action** creates a **Project Board with pre-populated Issues**, based on **Issue-Templates**.

---

## Overview 

![overview](docs/images/pb-action.png)

---

## Action Workflow Example

Location: `.github/workflows/action.yml`

```Yaml
name: Test

on:
  workflow_dispatch:
    inputs:
      template:
        type: string
        description: template
        required: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install @octokit/action
      - uses: ./
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          templateName: ${{ github.event.inputs.template }}

```

---

## Project Template Sample

Location: `.github/PROJECT_TEMPLATE/prj-template-a.yml`

```Yaml
---
projects:
  - name: Project_1
    description: Test Project 
    columns:
      # Project Board Column  
      - name: ToDo
        manage: none
        cards:
          - name: Issue_1
            type: Issue
            template: bug
            parameters:
              TASK: BUG
              TITLE: another one
          - name: Issue_2
            type: Issue
            template: task
            parameters:
              TASK: BUG
              TITLE: another one
      # Project Board Column  
      - name: InProgress
        manage: none
        cards:
          - name: Card_1
            type: Card
            template: bug
          - name: Issue_1
            type: Issue
            template: task
      # Project Board Column  
      - name: Done
        manage: none

```

## Concept Details

### TL;DR

#### The goal of this action is to **`build a project board`** and `Cards` from scratch, using a template Yaml file!

This action strictly uses templates to create all of it's components. Project board `Issues` as well as `Cards`, must be based on a `.github/ISSUE_TEMPLATE`.

 :thinking: Why? ...This ensures a standardized process that provides consitency and reusablilty.

However, this approach requires that we have an `Issue Template` for every project card we create.
To be precise, you cannot provide project card  content information in the project template Yaml file, only references to `Issue Templates`.

> NOTE: Project Cards are created based on Issue Templates, the content only, not the Header information (assignees, label, etc.)
