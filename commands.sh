########
# Helm
#######

# Install all dependecies
cd kube
helm dependency update

# Debug and see the generated tamplates
helm install --dry-run --debug video-ir ./kube -f kube/values.yaml --create-namespace --namespace dev

# Install/Upgrade
helm upgrade --install video-ir ./kube -f kube/values.yaml --create-namespace --namespace dev

# Delete all
helm ls -n dev --all --short | xargs -L1 helm -n dev delete


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
apt update
### curl to test urls
apt install curl -y
### this one is usefull to debug dns eg. nslookup redis to see how name is resolved
apt-get install dnsutils -y
### redis client to test connection
apt-get install redis
### qucly check connection
telnet redis-master 6379
telnet video-ir-kafka 9092

# Port forwarding 
kubectl port-forward service/kafka-dev  9092:9092 -n dev
kubectl port-forward service/video-ir-rabbitmq 15672:15672 -n dev

# Get password for kafka
kubectl get secret video-ir-kafka-user-passwords --namespace dev -o jsonpath='{.data.client-passwords}' | base64 -d | cut -d , -f 1

# Delete volumes
kubectl delete pvc --all -n dev 


# Context
kubectl config get-contexts
kubectl config use-context do-sfo3-viral-cluster-0



#########
# Rebuild dockers
########
cd app-backend &&
pnpm docker:build &&
cd ../app-frontend &&
pnpm docker:build &&
cd ../downloader &&
pnpm docker:build &&
cd ../indexer
pnpm docker:build &&
cd ../app-frontend &&
cd ..



#########
# API curl requests. Note: probobly ports in url will need to change depending on configuration
########

curl --location 'http://localhost:5173/api/resetDB'

curl --location 'http://localhost:3001/api/download' \
--header 'Content-Type: application/json' \
--data '{
    "name": "highway-surveillance",
    "target": "https://www.youtube.com/watch?v=PJ5xXXcfuTc",
    "fps": 30
}'

curl --location 'http://localhost:5173/api/indexImages?name=highway-surveillance'

curl 'http://localhost:5173/api/queryBox?boxId=c3c431632713de9ea13ed82a6cfad02b'