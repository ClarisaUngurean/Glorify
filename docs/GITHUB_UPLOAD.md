# GitHub Upload Guide

The canonical team repository is [ClarisaUngurean/Glorify](https://github.com/ClarisaUngurean/Glorify/tree/main).

## Recommended method: a feature branch

Do not upload directly to `main`. Put the challenge bench on its own branch so teammates can review it first.

## 1. Clone the team repository

```bash
git clone https://github.com/ClarisaUngurean/Glorify.git
cd Glorify
git switch -c feature/xss-challenge-bench
```

If the repository is already cloned:

```bash
cd Glorify
git pull --ff-only
git switch -c feature/xss-challenge-bench
```

## 2. Copy the challenge files

Copy these repository-relative items into the root of the Glorify checkout:

```text
.gitignore
package.json
README.md
challenges/
contracts/
docs/
scripts/
services/
tests/
```

`STRATEGY.md` is already present at the Glorify repository root and does not need to be copied again. The repository currently has no existing application scaffold, so these challenge files can be added directly at the root. Recheck the repository before copying in case a teammate adds files in the meantime.

## 3. Verify before staging

```bash
npm test
npm run smoke:site3
npm run check:privacy
```

All three commands must pass.

## 4. Inspect exactly what Git will upload

```bash
git status --short
git diff -- . ':!package-lock.json'
```

Check that the change contains no:

- `.env` files;
- API keys or tokens;
- personal absolute home-directory paths;
- screenshots or recordings;
- browser profiles, cookies, or exported session data;
- unrelated personal files.

The automated privacy check is a safety net, not a substitute for reviewing `git diff`.

## 5. Stage only the intended files

Avoid `git add .` for the first upload. Stage the intended paths explicitly:

```bash
git add .gitignore package.json README.md challenges contracts docs scripts services tests
git status --short
git diff --cached
```

Review the staged diff before committing.

## 6. Commit and push the branch

```bash
git commit -m "Add repeatable reflected-XSS challenge bench"
git push -u origin feature/xss-challenge-bench
```

GitHub will display a link for opening a pull request. Open it, describe the experiment and its privacy properties, and ask a teammate to review it before merging.

## GitHub website alternative

For a few files, GitHub's **Add file -> Upload files** interface works. For this multi-directory project, Git is recommended because it preserves the directory structure and lets you inspect the complete diff before uploading.

Never upload API keys through either method. If the future Steel integration needs secrets, keep them in an ignored `.env` file locally and configure them through the deployment environment's secret manager.
