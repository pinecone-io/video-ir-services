clusterName="$(kubectl config view --minify -o jsonpath='{.clusters[].name}')" 

if ! [[ $clusterName =~ ^do- ]]; then
    echo "Please change your cluster. You are working on local claster:" $clusterName
    exit;
fi

# Uninstall video-ir
helm uninstall video-ir -n dev

# Build and publish images for all services to DO
./build-all.sh

# Wait until everything is indexed and removed
# Bug: newly compiled image is not puled in k8
sleep 60

# Crearte namespace
kubectl create namespace dev

# Create env secrets
kubectl delete secret app-backend-env -n dev
kubectl create secret generic app-backend-env --from-env-file=./env/.env.app-backend -n dev

# Install chart
helm upgrade --install video-ir ./kube -f kube/values.yaml --create-namespace --namespace dev