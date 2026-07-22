# Publishing Zentrid to GitHub

The `.github` directory is part of the repository and contains the CI workflow at `.github/workflows/ci.yml`.

## Recommended: push with Git

Run from the directory that contains `package.json`:

```powershell
git init
git add -A
git status
git commit -m "Prepare Zentrid for GitHub and Vercel"
git branch -M main
git remote add origin https://github.com/<USER>/<REPOSITORY>.git
git push -u origin main
```

`git status` must show `.github/workflows/ci.yml` before the commit. If it does not, force-add it:

```powershell
git add -f .github/workflows/ci.yml
git commit -m "Add GitHub Actions workflow"
git push
```

## GitHub web interface fallback

Open the repository and choose **Add file → Create new file**. Enter this full path as the filename:

```text
.github/workflows/ci.yml
```

Paste the contents of the local `.github/workflows/ci.yml` file and commit it to `main`.
