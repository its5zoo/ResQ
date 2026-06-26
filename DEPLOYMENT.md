# Deploying ResQ AI to Google Cloud Run using Docker

This guide provides step-by-step instructions to build, package, and deploy the ResQ AI Productivity Companion application to **Google Cloud Run** using a production-grade multi-stage Docker setup.

---

## 1. Prerequisites

Before starting, ensure you have the following accounts, configurations, and tools set up:

### Tools & CLI Installation
1. **Docker**: Install Docker Desktop (or engine) on your machine. [Get Docker](https://docs.docker.com/get-docker/)
2. **Google Cloud CLI**: Install the Google Cloud SDK to access the `gcloud` command-line tool. [Install Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
3. **Node.js**: Node.js (v18+) is required for running local verification scripts. [Install Node.js](https://nodejs.org/)

### Accounts & Billing
- **Google Cloud Platform (GCP) Account**: Sign up at [Google Cloud](https://cloud.google.com/).
- **Billing Enabled**: Google Cloud Run and Artifact Registry require a billing account in good standing. Set up your billing account in the [GCP Billing Console](https://console.cloud.google.com/billing).
- **External API Accounts**:
  - **MongoDB Atlas** (Free Tier): Required for hosting your MongoDB database.
  - **Google Gemini API**: Required for AI features.
  - **ElevenLabs API**: Required for voice synthesis.
  - **Razorpay API**: Required for subscriptions and payment flows.
  - **Resend API**: Required for automated transaction emails.

---

## 2. Google Cloud Setup

Follow these steps to configure your GCP project and prepare it for Docker container deployment.

### 2.1 Authenticate Google Cloud CLI
Initialize and authenticate the `gcloud` tool on your local machine:
```bash
gcloud auth login
```
This command opens your default browser for authorization. Log in with your GCP administrator account.

### 2.2 Create a Google Cloud Project
Create a new project specifically for the application:
```bash
gcloud projects create resq-ai-production --name="ResQ AI Production"
```
Set the active project context for the CLI:
```bash
gcloud config set project resq-ai-production
```

### 2.3 Enable Required APIs
Enable the services required for Docker builds, registry storage, and serverless execution:
```bash
gcloud services enable run.googleapis.com \
                       artifactregistry.googleapis.com \
                       cloudbuild.googleapis.com
```

### 2.4 Configure Artifact Registry
Create a repository in the Artifact Registry to store your production Docker images:
```bash
gcloud artifacts repositories create resq-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for ResQ AI production images"
```

### 2.5 Configure Docker Authentication
Configure your local Docker daemon to authenticate with Google Artifact Registry:
```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

---

## 3. Docker Local Operations

Before pushing to Google Cloud, build and test the container locally to verify everything runs smoothly.

### 3.1 Build the Production Image
Build the multi-stage container. This automatically builds the React frontend and packages it into the Express Node.js backend:
```bash
docker build -t resq-app:latest .
```

### 3.2 Run the Container Locally
Run the built container locally on port `8080` (matching the default Cloud Run port). You must supply mock or local development environment variables:
```bash
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e MONGO_URI="mongodb://host.docker.internal:27017/resq" \
  -e JWT_SECRET="local_development_jwt_secret_key_12345" \
  resq-app:latest
```
*Note: If your MongoDB is running locally on your host machine, use `mongodb://host.docker.internal:27017/resq` to allow the Docker container to access the host's localhost database.*

### 3.3 Verify Local Behavior
- Visit `http://localhost:8080` in your web browser. You should see the ResQ landing/login page.
- Test the health check endpoint:
  ```bash
  curl http://localhost:8080/api/health
  ```
  It should return `{"status":"ok","message":"ResQ API is running smoothly"}`.

### 3.4 Troubleshooting Local Docker Issues
- **Container Exited Immediately**: Run `docker logs [CONTAINER_ID]` to inspect output. Usually, this is caused by missing required environment variables (`MONGO_URI` or `JWT_SECRET`) which throw startup errors.
- **Port Mapping Conflict**: Ensure no other process is listening on port `8080`. Modify the run port using `-p 9090:8080`.
- **CORS Errors**: In production mode, the frontend is served from the same container port/host as the backend, eliminating CORS issues entirely. If you're building a split-deployment, make sure the backend's `CLIENT_URL` matches your frontend domain exactly.

---

## 4. Push to Artifact Registry

Once validated locally, tag and upload the Docker image to your GCP repository.

### 4.1 Tag the Image
Tag the local image with the remote Google Artifact Registry destination:
```bash
docker tag resq-app:latest us-central1-docker.pkg.dev/resq-ai-production/resq-repo/resq-app:latest
```

### 4.2 Push the Image
Upload the tagged image to your Google Cloud Artifact Registry repository:
```bash
docker push us-central1-docker.pkg.dev/resq-ai-production/resq-repo/resq-app:latest
```

### 4.3 Verify the Upload
List the images in your registry to verify:
```bash
gcloud artifacts docker images list us-central1-docker.pkg.dev/resq-ai-production/resq-repo
```

---

## 5. Google Cloud Run Deployment

Deploy your containerized application to Google Cloud Run. Cloud Run automatically handles routing, SSL termination, and scales to zero instances when idle to save costs.

### 5.1 Prepare Environment Variables and Secrets
For security compliance, keep sensitive keys out of your deployment command history by using GCP Secret Manager, or supply them through Cloud Run Environment Variables.

Create a local environment file `env.prod.yaml` containing the environment configuration (do not check this file into Git):
```yaml
PORT: "8080"
NODE_ENV: "production"
MONGO_URI: "mongodb+srv://[DB_USER]:[DB_PASSWORD]@[CLUSTER].mongodb.net/resq"
JWT_SECRET: "[YOUR_JWT_SECRET]"
CLIENT_URL: "https://resq-service-xxx-uc.a.run.app"
GEMINI_API_KEY: "[YOUR_GEMINI_API_KEY]"
GEMINI_MODEL: "gemini-2.5-flash"
GOOGLE_CLIENT_ID: "[YOUR_GOOGLE_CLIENT_ID]"
GOOGLE_CLIENT_SECRET: "[YOUR_GOOGLE_CLIENT_SECRET]"
GOOGLE_REDIRECT_URI: "https://resq-service-xxx-uc.a.run.app/api/google/callback"
ELEVENLABS_API_KEY: "[YOUR_ELEVENLABS_API_KEY]"
VAPID_PUBLIC_KEY: "[YOUR_VAPID_PUBLIC_KEY]"
VAPID_PRIVATE_KEY: "[YOUR_VAPID_PRIVATE_KEY]"
VAPID_EMAIL: "mailto:[YOUR_EMAIL]"
RESEND_API_KEY: "[YOUR_RESEND_API_KEY]"
RAZORPAY_KEY_ID: "[YOUR_RAZORPAY_KEY]"
RAZORPAY_KEY_SECRET: "[YOUR_RAZORPAY_SECRET]"
```

### 5.2 Deploy to Cloud Run
Execute the deployment command. Specify scaling parameters, timeout, memory allocation, and inject the environment configuration:
```bash
gcloud run deploy resq-service \
  --image=us-central1-docker.pkg.dev/resq-ai-production/resq-repo/resq-app:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --env-vars-file=env.prod.yaml \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=300
```

### 5.3 Verify the Cloud Run Instance
Once deployment succeeds, the CLI will output a live URL (e.g. `https://resq-service-xxx-uc.a.run.app`). 
1. Open this URL in your browser to verify application page rendering and assets.
2. In the console or local terminal, verify that the health route returns a `200 OK`.
3. Make sure to update the `CLIENT_URL` and `GOOGLE_REDIRECT_URI` environment variables to match the actual URL provided by Cloud Run!

---

## 6. Configuring Production Settings

### 6.1 Environment Variables Configuration in GCP Console
You can edit and manage environment variables visually through the GCP Console:
1. Go to the [Google Cloud Run Console](https://console.cloud.google.com/run).
2. Click on **resq-service**.
3. Click **Edit & Deploy New Revision** at the top.
4. Go to the **Variables & Secrets** tab.
5. Add/edit your environment variables.
6. Click **Deploy**.

### 6.2 MongoDB Network Settings
Because Google Cloud Run assigns dynamic IP addresses to running containers, you must configure MongoDB Atlas to accept incoming connections from the Cloud Run servers:
1. Go to the **MongoDB Atlas Console**.
2. Click **Network Access** under Security.
3. Click **Add IP Address**.
4. Select **Allow Access From Anywhere** (`0.0.0.0/0`) and click **Confirm**.
*(Alternatively, use VPC peering or VPC connectors for enterprise static IP routing).*

---

## 7. Custom Domains & HTTPS

Google Cloud Run services are secured with managed SSL certificates automatically. To bind your own brand name:

1. Go to the **Google Cloud Run Console**.
2. Click **Manage Custom Domains** at the top or in the routing tab.
3. Click **Add Mapping**.
4. Choose the service `resq-service` and enter your custom domain (e.g., `resq.yourdomain.com`).
5. GCP will generate DNS resource records (typically a **CNAME** or **A/AAAA** records).
6. Go to your DNS provider (e.g., GoDaddy, Cloudflare, Namecheap) and create the corresponding CNAME record mapping to the target hostname provided by Google (e.g., `ghs.googlehosted.com`).
7. Wait for DNS propagation. SSL certificate provisioning takes between 15 minutes and 1 hour. Once verified, HTTPS will be active.

---

## 8. Monitoring & Maintenance

### 8.1 Viewing Production Logs
To view real-time log outputs in your command line:
```bash
gcloud run logs read resq-service --limit=50
```
Or check application exceptions, user flows, and errors inside the Google Cloud Console under **Cloud Logging** (Stackdriver).

### 8.2 Rollback Deployments
If a regression or critical bug is detected in production, roll back to a previous revision instantly:
1. Go to the **Cloud Run Console** and click on **resq-service**.
2. Navigate to the **Revisions** tab.
3. Select the previous stable revision.
4. Click **Manage Traffic** at the top.
5. Route 100% of incoming traffic back to the selected stable revision and click **Save**.

---

## 9. Updating the Application

To roll out updates to your application:

1. **Rebuild the Docker Image**:
   ```bash
   docker build -t resq-app:latest .
   ```
2. **Tag and Push**:
   ```bash
   docker tag resq-app:latest us-central1-docker.pkg.dev/resq-ai-production/resq-repo/resq-app:latest
   docker push us-central1-docker.pkg.dev/resq-ai-production/resq-repo/resq-app:latest
   ```
3. **Deploy the New Revision**:
   ```bash
   gcloud run deploy resq-service \
     --image=us-central1-docker.pkg.dev/resq-ai-production/resq-repo/resq-app:latest \
     --platform=managed \
     --region=us-central1
   ```
   *Cloud Run will execute a zero-downtime rolling update. Active users will transition to the new revision automatically.*
