# GitHub Container Registry (GHCR) Setup Guide

This guide explains how to set up and use GitHub Container Registry (GHCR) for deploying your Docker images.

## What is GHCR?

GitHub Container Registry (ghcr.io) is GitHub's Docker container registry service. It's integrated with GitHub and provides:
- Free for public repositories
- Private registry support
- Integrated with GitHub Actions
- No separate account needed (uses GitHub account)

## Prerequisites

- GitHub account
- Docker installed locally
- GitHub Personal Access Token (PAT) with appropriate permissions

## Step 1: Create GitHub Personal Access Token (PAT)

1. Go to GitHub: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name (e.g., "GHCR Docker Push")
4. Set expiration (recommend 90 days or custom)
5. Select scopes:
   - ✅ `write:packages` - Upload packages
   - ✅ `read:packages` - Download packages
   - ✅ `delete:packages` - Delete packages (optional)
6. Click "Generate token"
7. **Copy the token immediately** (you won't see it again!)

## Step 2: Authenticate with GHCR

### Option A: Using Docker CLI (Recommended)

```bash
# Login to GHCR using your GitHub username and PAT
echo $GITHUB_TOKEN | docker login ghcr.io -u <your-github-username> --password-stdin

# Or interactively:
docker login ghcr.io -u <your-github-username>
# When prompted, enter your PAT (not your GitHub password)
```

### Option B: Using GitHub CLI (gh)

If you have GitHub CLI installed:

```bash
# Install GitHub CLI (if not installed)
# macOS:
brew install gh

# Linux:
# See: https://github.com/cli/cli/blob/trunk/docs/install_linux.md

# Authenticate
gh auth login

# This will automatically configure Docker authentication for GHCR
gh auth setup-git
```

### Option C: Manual Credential Storage

```bash
# Create/edit Docker config
mkdir -p ~/.docker
cat > ~/.docker/config.json << EOF
{
  "auths": {
    "ghcr.io": {
      "auth": "$(echo -n '<username>:<token>' | base64)"
    }
  }
}
EOF
```

## Step 3: Build and Push Image

### Using the Build Script

```bash
# Make script executable
chmod +x build_and_push.sh

# Build and push to GHCR
./build_and_push.sh ghcr.io <github-username>/mesulo-ai-video v1.0.0 <github-username> <your-pat>
```

### Manual Commands

```bash
# 1. Build the image
docker build -t ghcr.io/<github-username>/mesulo-ai-video:v1.0.0 .

# 2. Login (if not already logged in)
echo $GITHUB_TOKEN | docker login ghcr.io -u <github-username> --password-stdin

# 3. Push the image
docker push ghcr.io/<github-username>/mesulo-ai-video:v1.0.0
```

## Step 4: Make Package Public or Private

By default, packages are private. To make them public:

1. Go to your GitHub repository
2. Click "Packages" in the right sidebar
3. Click on your package
4. Go to "Package settings"
5. Scroll down to "Danger Zone"
6. Click "Change visibility" → "Make public"

Or use GitHub CLI:

```bash
gh api user/packages/container/<package-name> -X PATCH -f visibility=public
```

## Step 5: Configure RunPod

1. Go to RunPod Console: https://www.runpod.io/console/serverless
2. Create new endpoint or edit existing
3. Select "Custom Docker Image"
4. Enter image: `ghcr.io/<github-username>/mesulo-ai-video:v1.0.0`
5. Configure registry credentials:
   - **Registry URL**: `ghcr.io`
   - **Username**: Your GitHub username
   - **Password**: Your GitHub PAT (Personal Access Token)
6. Deploy!

## GitHub CLI (gh) Commands

### Install GitHub CLI

**macOS:**
```bash
brew install gh
```

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

**Windows:**
```powershell
winget install GitHub.cli
```

### Useful GitHub CLI Commands

```bash
# Login to GitHub
gh auth login

# Check authentication status
gh auth status

# View packages
gh api user/packages

# View specific package
gh api user/packages/container/<package-name>

# Make package public
gh api user/packages/container/<package-name> -X PATCH -f visibility=public

# Delete package
gh api user/packages/container/<package-name> -X DELETE

# Refresh token
gh auth refresh
```

## Environment Variables Setup

Create a `.env` file (don't commit this!):

```bash
# .env
GITHUB_USERNAME=your-github-username
GITHUB_TOKEN=ghp_your_personal_access_token
GHCR_IMAGE=ghcr.io/your-github-username/mesulo-ai-video
GHCR_TAG=v1.0.0
```

Then use in scripts:

```bash
source .env
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
docker build -t ${GHCR_IMAGE}:${GHCR_TAG} .
docker push ${GHCR_IMAGE}:${GHCR_TAG}
```

## Quick Reference

### Image Naming Convention

```
ghcr.io/<github-username>/<package-name>:<tag>
```

Examples:
- `ghcr.io/johndoe/mesulo-ai-video:v1.0.0`
- `ghcr.io/johndoe/mesulo-ai-video:latest`
- `ghcr.io/johndoe/mesulo-ai-video:main` (for branch-based tags)

### Common Workflow

```bash
# 1. Set variables
export GITHUB_USERNAME="your-username"
export GITHUB_TOKEN="ghp_your_token"
export IMAGE_NAME="mesulo-ai-video"
export TAG="v1.0.0"

# 2. Login
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# 3. Build
docker build -t ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:$TAG .

# 4. Push
docker push ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:$TAG

# 5. Verify (optional)
docker pull ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:$TAG
```

## Troubleshooting

### Authentication Errors

**Error: "unauthorized: authentication required"**
- Verify your PAT has `write:packages` scope
- Check that you're using PAT, not GitHub password
- Ensure token hasn't expired

**Error: "denied: permission denied"**
- Check package visibility (private packages need authentication)
- Verify username matches GitHub username exactly
- Ensure PAT has correct scopes

### Image Not Found

**Error: "manifest unknown"**
- Verify image name and tag are correct
- Check if package exists in GitHub Packages
- Ensure you have read permissions

### Rate Limiting

GitHub has rate limits for API calls:
- Authenticated: 5,000 requests/hour
- Unauthenticated: 60 requests/hour

If you hit limits, wait or use authenticated requests.

## Security Best Practices

1. **Never commit tokens**: Use environment variables or secrets management
2. **Use fine-grained tokens**: Create tokens with minimal required scopes
3. **Set expiration**: Don't create tokens without expiration
4. **Rotate regularly**: Update tokens periodically
5. **Use package permissions**: Set package access permissions in GitHub
6. **Enable 2FA**: Always enable two-factor authentication on GitHub

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Build and Push to GHCR

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to GHCR
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push
        run: |
          docker build -t ghcr.io/${{ github.repository_owner }}/mesulo-ai-video:${{ github.ref_name }} .
          docker push ghcr.io/${{ github.repository_owner }}/mesulo-ai-video:${{ github.ref_name }}
```

## Next Steps

1. Set up your GitHub PAT
2. Authenticate with GHCR
3. Build and push your image
4. Configure RunPod to use the image
5. Set up automated builds (optional)

For more information, see:
- [GitHub Container Registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Login Documentation](https://docs.docker.com/engine/reference/commandline/login/)



