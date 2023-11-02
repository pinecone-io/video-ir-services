cd app-frontend &&
pnpm docker &&
cd ..
helm upgrade --install video-ir ./kube -f kube/values.yaml -n dev
