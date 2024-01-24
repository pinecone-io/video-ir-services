cd video-splitter &&
pnpm docker &&
sleep 60
cd ..
helm upgrade --install video-ir ./kube -f kube/values.yaml -n dev
kubectl rollout restart deployment video-ir-dev-video-splitter -n dev
