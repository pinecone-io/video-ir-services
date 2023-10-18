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

# Execute commands from pod
kubectl exec -n dev -it {pod-name} -- /bin/bash

## In case someting is missing in pod eg. curl we can install it
apt update && apt install curl -y

#########
# Rebuild dockers
########
cd app-backend &&
pnpm docker:build &&
cd ../downloader &&
pnpm docker:build &&
cd ..



#########
# API curl requests. Note: probobly ports in url will need to change depending on configuration
########

curl --location 'http://localhost:5173/api/resetDB'

curl --location 'http://localhost:5173/api/download' \
--header 'Content-Type: application/json' \
--data '{
    "name": "highway-surveillance",
    "target": "https://www.youtube.com/watch?v=PJ5xXXcfuTc",
    "fps": 30
}'

curl --location 'http://localhost:5173/api/indexImages?name=highway-surveillance'

curl 'http://localhost:5173/api/queryBox?boxId=c3c431632713de9ea13ed82a6cfad02b'