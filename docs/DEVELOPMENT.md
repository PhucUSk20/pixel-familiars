# Developing Pixel Familiars

Owner and maintainer: [PhucUSk20](https://github.com/PhucUSk20).
Repository: [PhucUSk20/pixel-familiars](https://github.com/PhucUSk20/pixel-familiars).

## Two separate working directories

- `../pixel-pet`: the existing fork and contribution branch. Keep its remotes and PR intact. Push review fixes there only when they belong in that PR.
- `pixel-familiars`: this independent repository, with its own `.git` directory, branches and working files. New development here does not update the other fork or its PR.

History is preserved so original authors and shared ancestry remain available. `origin` points to PhucUSk20/pixel-familiars. `upstream` points to Namenomeaning/pixel-pet for optional updates. The upstream owner has no automatic write access to this independent repository. GitHub collaborators are managed in this repository's Settings.

## Everyday development

Run these commands inside `pixel-familiars`:

```powershell
git remote -v
git switch -c feat/my-feature
```

After editing and running the relevant checks, commit the intended files and push the feature branch:

```powershell
git add <files>
git commit -m "feat: describe the change"
git push -u origin feat/my-feature
```

Open a PR in **PhucUSk20/pixel-familiars** when using a review workflow. It is separate from the PR already open against Namenomeaning/pixel-pet.

## Bringing in upstream updates

Fetch and inspect before merging. Prefer an integration branch so upstream changes can be tested before they reach `main`:

```powershell
git fetch upstream
git log --oneline main..upstream/main
git switch -c sync/upstream main
git merge upstream/main
```

Resolve any conflicts, run checks, then push that branch to `origin` for review. Do not push to `upstream`.

## Contributing a selected improvement back

Commit the improvement here first. In the sibling `pixel-pet` working copy, fetch this local repository and select the intended commits:

```powershell
git fetch ../pixel-familiars main
git cherry-pick <commit-sha>
```

Use a suitable contribution branch and push to that fork's `origin`. Only commits pushed to the existing PR's source branch change that PR. Repository-specific branding commits should stay here.

## Installation and compatibility

Use `npm.cmd run install:codex` from this directory when choosing to install this development copy. Hook review is still required. Installation updates the local hook/MCP paths to this directory; installing the sibling copy later changes them back. Keep one installed development copy active at a time.

For compatibility, extension identifiers, `pixelPet.*` commands/settings, `pixel-pet-codex` package/VSIX names and preserved Claude plugin paths currently retain their established names. The displayed extension name is **Pixel Familiars**. `pixel-pet-local` is a technical local publisher identifier, not ownership or a grant of repository access. Marketplace publishing can migrate identifiers separately.

## Verification and attribution

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run package
```

Also run `npm.cmd run test:ui` after host, renderer or bridge changes. Follow `AGENTS.md` and the preserved plugin's `CLAUDE.md` where applicable.

Keep original copyright notices, the MIT license and inherited commit authorship. Pixel Familiars modifications are attributed to PhucUSk20. New repository ownership does not rewrite the authorship of inherited code.
