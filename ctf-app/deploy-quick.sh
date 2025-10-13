#!/bin/bash

# Quick manual deployment commands for CTF Tracker
# Run these commands one by one

# 1. Ensure you're logged into OpenShift
echo "Checking OpenShift login..."
oc whoami

# 2. Create/use project
echo "Creating project..."
oc new-project ctf-project || oc project ctf-project

# 3. Create application secret (replace with your secret)
echo "Creating app secret..."
oc create secret generic ctf-tracker-secret \
    --from-literal=app-secret-key="$(openssl rand -hex 32)" \
    --dry-run=client -o yaml | oc apply -f -

# 4. Deploy from Git (using OpenShift built-in Python image)
echo "Deploying application..."
oc new-app python:3.9-ubi8~https://github.com/DarrickLeong/ctf_ansible_workshop.git \
    --context-dir=ctf-app \
    --name=ctf-tracker \
    --env=FLASK_ENV=production \
    --env=FLASK_DEBUG=false

# 5. Expose the service
echo "Exposing service..."
oc expose service/ctf-tracker

# 6. Get the URL
echo "Getting application URL..."
APP_URL=$(oc get route ctf-tracker -o jsonpath='{.spec.host}')
echo "CTF Tracker URL: https://$APP_URL"

# 7. Show status
echo "Checking status..."
oc get pods -l app=ctf-tracker
