# `node-tfe-run` Action

This GitHub Action creates a new run on Terraform Cloud. Integrate Terraform Cloud into your GitHub Actions workflow.

This action creates runs using [the Terraform Cloud API][tfe-api] which provides more flexibility than using the CLI. Namely, you can:
- define your own message (no more _"Queued manually using Terraform"_)
- provide as many variables as you want

Internally, we leverage [the official Terraform Cloud REST API from Hashicorp][tfe-api].

[tfe-api]: https://www.terraform.io/docs/cloud/run/api.html

## How to use it

```yaml
- uses: aminubakori/node-tfe-run@v1.0
  with:
    token: ${{ secrets.TFE_TOKEN }}
    workspace: node-tfe-run
    message: |
      Run triggered using node-tfe-run (commit: ${{ github.SHA }})
  id: node-tfe-run

... next steps can access the run URL with ${{ steps.node-tfe-run.outputs.run-url }}
```

Full option list:
 
```yaml
- uses: aminubakori/node-tfe-run@v1.0
  with:
    # Token used to communicate with the Terraform Cloud API. Must be a user or
    # team api token.
    token: ${{ secrets.TFE_TOKEN }}

    # Name of the organization on Terraform Cloud. Defaults to the GitHub
    # organization name.
    organization: aminubakori

    # Name of the workspace on Terraform Cloud.
    workspace: node-tfe-run

    # Optional message to use as name of the run.
    message: |
      Run triggered using node-tfe-run (commit: ${{ github.SHA }})

    # Optional list of variables to add or update
    # This can be used to set Terraform variables.
    variables: |
      run_number = ${{ github.run_number }}
      service    = "example"

  # Optionally, assign this step an ID so you can refer to the outputs from the
  # action with ${{ steps.<id>.outputs.<output variable> }}
  id: node-tfe-run
```

### Inputs

Name           | Required | Description                                                                                                     | Type   | Default
---------------|----------|-----------------------------------------------------------------------------------------------------------------|--------|--------
`token`        | yes      | Token used to communicating with the Terraform Cloud API. Must be [a user or team api token][tfe-tokens].       | string | 
`organization` |          | Name of the organization on Terraform Cloud.                                                                    | string | The repository owner
`workspace`    | yes      | Name of the workspace on Terraform Cloud.                                                                       | string |
`message`      |          | Optional message to use as name of the run.                                                                     | string | _Queued by GitHub Actions (commit: $GITHUB_SHA)_
`variables`    |          | The contents of a auto.tfvars file that will be uploaded to Terraform Cloud.                                    | string |

[tfe-tokens]: https://www.terraform.io/docs/cloud/users-teams-organizations/api-tokens.html

### Outputs

Name          | Description                                                                                       | Type
--------------|---------------------------------------------------------------------------------------------------|-----
`run-url`     | URL of the run on Terraform Cloud                                                                 | string


## License

This Action is distributed under the terms of the MIT license, see [LICENSE](./LICENSE) for details.