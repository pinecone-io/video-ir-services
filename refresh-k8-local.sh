clusterName="$(kubectl config view --minify -o jsonpath='{.clusters[].name}')" 

if [[ $clusterName =~ ^do- ]]; then
    echo "Please change your cluster. You are working on remote claster:" $clusterName
    exit;
fi

# Uninstall video-ir
helm uninstall video-ir -n dev

# Crearte namespace
kubectl create namespace dev

# Create env secrets
kubectl delete secret app-backend-env -n dev
kubectl create secret generic app-backend-env --from-env-file=./env/.env.app-backend -n dev

# Install chart
helm upgrade --install video-ir ./kube-local -f kube-local/values-local.yaml --create-namespace --namespace dev