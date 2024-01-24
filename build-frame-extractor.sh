cd frame-extractor &&
pnpm docker &&
cd ..
helm upgrade --install video-ir ./kube -f kube/values.yaml -n dev
kubectl rollout restart deployment video-ir-dev-frame-extractor -n dev
