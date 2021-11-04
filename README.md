# project-template-action

GitHub action to create Project Boards from template Yaml files.

This **Action** creates a **Project Board with pre-polulated Issues**, based on **Issue-Templates**.

## Action Workflow Example

Location: `.github/workflows/action.yml`

```Yaml
name: project-template-action

on:
  issues:
    types: [opened, edited]
  issue_comment:
    types: [created,edited]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install @octokit/action
      - uses: jefeish/project-template-action@v1
        with:
          GITHUB_TOKEN: ${{ secrets.SECRET_PAT }}
```

---

## Issue *Trigger-Command*

to trigger an automated project board setup based on templates, place a `/slash` command in an Issue comment or body. 

### Sample

```bash
/project prj-template-a
```

---

## Project Template Sample

Location: `.github/PROJECT_TEMPLATE/prj-template-a.yml`

```Yaml
---
name: Project_1
description: Test Project
columns:
  - name: ToDo
    manage: none
  - name: InProgress
    manage: none
  - name: Done
    manage: none
Issues:
  - name: Issue_1
    template: bug
  - name: Issue_2
    template: task
  - name: Issue_3
    template: rfc
```

