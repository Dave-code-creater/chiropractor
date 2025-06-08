#!/bin/bash
# Build docker images and deploy to Kubernetes
set -e

if ! command -v kubectl &>/dev/null; then
  echo "kubectl could not be found. Please install kubectl." >&2
  exit 1
fi

if ! command -v docker &>/dev/null; then
  echo "docker could not be found. Please install Docker." >&2
  exit 1
fi

SERVICES=(gateway auth-service user-service report-service appointment-service chat-service blog-service)

for svc in "${SERVICES[@]}"; do
  echo "Building $svc image..."
  docker build -t "$svc:latest" "./$svc"
 done

kubectl apply -f k8s/
