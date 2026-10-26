# Gourmet Group

A small, read-only recipe sample: browse six recipes, search by ingredients, and
open cooking instructions. No accounts, database, uploads, or external APIs.
The teal styling and food photography remain; photos are illustrative.

## Run

Install the latest patch of [Node.js 24 LTS](https://nodejs.org/), then:

```powershell
node index.js
```

Open <http://localhost:3000>. That's it. **No npm packages need to be installed.**
`npm start` also works. Set `PORT` to use a different port; Azure supplies it
automatically.

## How it works

Plain HTML, CSS, and browser JavaScript, plus a small server using only Node's
built-in HTTP and file APIs. Recipes live in `public\recipes.json`; edit that file
to change the catalog. JavaScript must be enabled for search and recipe details.
Recipes can be bookmarked, but nothing is saved to the server.

There are **zero third-party npm dependencies**. Express, EJS, Passport,
body-parser, Sequelize, and the old integrations have been removed, not downgraded
or patched around. The server only serves an explicit list of public files,
rejects write methods, and sets a restrictive Content Security Policy. Keep Node
and the Azure runtime patched; a zero-dependency audit isn't a guarantee against
all security issues.

## Deploy to Azure App Service

Use **Linux App Service with Node.js 24 LTS** and **run from ZIP package**. The
site is read-only and needs no build step or dependency restore at startup.

Create an app in the Azure portal, or use Azure CLI from PowerShell (choose your
own names; B1 incurs charges):

```powershell
az login
$group = 'recipes-sample-rg'
$app = '<globally-unique-app-name>'
az group create --name $group --location westus2
az appservice plan create --name recipes-sample-plan --resource-group $group --is-linux --sku B1
az webapp create --name $app --resource-group $group --plan recipes-sample-plan --runtime 'NODE:24-lts'
```

### Manual ZIP deployment

Run from the repository root:

```powershell
Compress-Archive -Path index.js,package.json,package-lock.json,public -DestinationPath .\app.zip -Force
az webapp config set --resource-group $group --name $app --linux-fx-version 'NODE|24-lts' --startup-file 'node index.js'
az webapp config appsettings set --resource-group $group --name $app --settings WEBSITE_RUN_FROM_PACKAGE=1 SCM_DO_BUILD_DURING_DEPLOYMENT=false NODE_ENV=production
az webapp deploy --resource-group $group --name $app --src-path .\app.zip --type zip
```

The ZIP must contain `index.js` at its root, not an enclosing repository folder.
There is no `node_modules` directory to include. Enable `/health` under App Service
> Monitoring > Health check.

### GitHub Actions

`.github\workflows\azure-app-service.yml` packages pull requests.
Pushes to `master` and manual runs on `master` also deploy to an existing app.
The workflow configures the runtime, startup command, health check, and
run-from-package settings above.

For passwordless deployment, configure
[GitHub Actions OIDC authentication](https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions#manually-set-up-a-github-actions-workflow):

1. Create an Entra deployment identity and grant **Website Contributor** scoped
   to this App Service.
2. Add a federated credential with issuer
   `https://token.actions.githubusercontent.com`, audience `api://AzureADTokenExchange`,
   and subject `repo:reillyanderson/project2_recipes:environment:production`.
   Substitute your own owner/repository for a fork.
3. Create the GitHub environment `production`. Add secrets `AZURE_CLIENT_ID`,
   `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, and variables `AZURE_WEBAPP_NAME`,
   `AZURE_RESOURCE_GROUP`.

The workflow also publishes an `app-service-package` artifact. Extract its inner
`app.zip` to use the manual deployment command. If you rename `master`, update
both the triggers and deployment guard in the workflow.

After deployment, visit `https://<app-name>.azurewebsites.net/` and `/health`
(returns `{"status":"ok"}`). No Azure resources are changed until you run the
commands or configure and run the workflow.
