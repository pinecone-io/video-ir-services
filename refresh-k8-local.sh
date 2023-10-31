# Uninstall video-ir
helm uninstall video-ir -n dev

# Build and publish images for all services to DO
./build-all-local.sh

# Create env secrets
kubectl delete secret app-backend-env -n dev
kubectl create secret generic app-backend-env --from-env-file=./env/.env.app-backend -n dev

# Install chart
helm upgrade --install video-ir ./kube-local -f kube-local/values.yaml --create-namespace --namespace dev