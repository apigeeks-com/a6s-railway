# Postgres
helm del --purge keycloak-postgres
kubectl delete pvc rga-keycloak-postgres-pvc -n a6s-cn-master
kubectl delete sc rga-keycloak-postgres-sc -n a6s-cn-master

# Minio
helm del --purge rga-minio
kubectl delete pvc rga-minio-pvc -n a6s-cn-master
kubectl delete sc rga-minio-sc -n a6s-cn-master

# Grafana
helm del --purge grafana
kubectl delete pvc rga-master-grafana-pvc -n a6s-cn-master
kubectl delete sc rga-master-grafana-sc -n a6s-cn-master

# Prometheus
helm del --purge prometheus
kubectl delete pvc rga-prometheus-pvc -n a6s-cn-master
kubectl delete sc rga-prometheus-sc -n a6s-cn-master