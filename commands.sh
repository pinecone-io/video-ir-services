########
# Helm
#######

# Install all dependecies
helm dependency update

# Debug and see the generated tamplates
helm install --dry-run --debug video-ir ./kube -f kube/values.yaml --create-namespace --namespace dev

# Install/Upgrade
helm upgrade --install video-ir ./kube -f kube/values.yaml --create-namespace --namespace dev


########
# kubectl
#######

# See what is running in kubernetes
kubectl get -n dev {pods|svc|all}

# See logs
kubectl logs -n dev {pod_id}

# Delete everything
kubectl delete all --all -n {namespace}
