# project-template-action
GitHub action to create Project Boards from template Yaml files


## Project Template Sample

Location: `.github/PROJECT_TEMPLATE/`

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
