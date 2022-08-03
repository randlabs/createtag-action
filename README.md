# createtag-action

A [GitHub Action][github-actions-url] to create tags and/or releases written in [TypeScript][typescript-url]

[![License][license-image]][license-url]
[![Issues][issues-image]][issues-url]

## Usage

```YML
    ...
    - name: Deleting mytag tag and release
      id: deltag
      uses: randlabs/createtag-action@v1.0.0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag: mytag
    ...
```

### Inputs

#### Common parameters:

```YML
inputs:
  tag:
    description: 'Tag name'
    required: true
  create_release:
    description: 'Set to true to indicate if the release must be created. Implies tag creation too.'
    required: false
    default: true
  create_tag:
    description: 'Set to true to indicate if only the tag must be created.'
    required: false
    default: true
  repo: 'Target repository in <owner-or-company>/<repository> format. Defaults to the one that fired the action.'
    required: false
  sha:
    description: 'The commit hash to tag. Defaults to the one that fired the action.'
    required: false
  branch:
    description: 'If a branch name is specified. The last commit hash on that branch will be used.'
    required: false
  ignore_existing:
    description: 'Set to false to stop if the tag/release already exists.'
    required: false
    default: true
```

#### For release creation:

```YML
inputs:
  name:
    description: 'Release name.'
    required: false
  body:
    description: 'Text describing the contents of the release.'
    required: false
  draft:
    description: 'Set to true to mark the release as draft.'
    required: false
  pre_release:
    description: 'Set to true to mark the release as a pre-release.'
    required: false
  auto_notes:
    description: 'Whether to automatically generate the name and body for this release. If name is specified, the specified name will be used; otherwise, a name will be automatically generated. If body is specified, the body will be pre-pended to the automatically generated notes.'
    required: false
```

#### For tag only creation:

```YML
inputs:
  message:
    description: 'Sets the tag message.'
    required: false
```

### Outputs

#### For release creation:

```YML
outputs:
  id:
    description: 'The release id.'
  url:
    description: 'The release url.'
  upload_url:
    description: 'The release artifact upload url.'
```

#### For tag only creation:

```YML
outputs:
  tag_sha:
    description: 'The hash of the new tag.'
```

### Environment variables:

`GITHUB_TOKEN` must be set to the workflow's token or the personal access token (PAT) required to accomplish the task.

[typescript-url]: http://www.typescriptlang.org/
[github-actions-url]: https://github.com/features/actions
[license-url]: https://github.com/randlabs/createtag-action/blob/master/LICENSE
[license-image]: https://img.shields.io/github/license/randlabs/createtag-action.svg
[issues-url]: https://github.com/randlabs/createtag-action/issues
[issues-image]: https://img.shields.io/github/issues-raw/randlabs/createtag-action.svg
