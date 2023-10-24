helm uninstall video-ir -n dev
./build-all.sh
helm upgrade --install video-ir ./kube -f kube/values.yaml --create-namespace --namespace dev