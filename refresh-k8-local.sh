clusterName="$(kubectl config view --minify -o jsonpath='{.clusters[].name}')" 

if [[ $clusterName =~ ^do- ]]; then
    echo "Please change your cluster. You are working on remote claster:" $clusterName
    exit;
fi

# Uninstall video-ir
helm uninstall video-ir -n dev

# Build and publish images for all services to DO
./build-all-local.sh

# Create env secrets
kubectl delete secret app-backend-env -n dev
kubectl create secret generic app-backend-env --from-env-file=./env/.env.app-backend -n dev

# Install chart
helm upgrade --install video-ir ./kube -f kube/values-local.yaml --create-namespace --namespace dev