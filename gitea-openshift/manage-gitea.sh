#!/bin/bash
#
# Gitea Management Helper Script
#

PROJECT_NAME=${PROJECT_NAME:-gitea}

# Check if project exists
check_project() {
    if ! oc get project "${PROJECT_NAME}" &> /dev/null; then
        echo "Error: Project '${PROJECT_NAME}' does not exist"
        echo "Please deploy Gitea first using: ./deploy-gitea.sh"
        exit 1
    fi
}

show_help() {
    echo "Gitea Management Helper"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  status       - Show Gitea status"
    echo "  logs         - Follow Gitea logs"
    echo "  url          - Get Gitea URL"
    echo "  list-users   - List all users"
    echo "  reset-password <username> <new-password> - Reset user password"
    echo "  delete-user <username> - Delete a user"
    echo "  restart      - Restart Gitea"
    echo "  backup       - Backup Gitea data"
    echo "  shell        - Open shell in Gitea pod"
    echo ""
}

get_pod() {
    oc get pods -n ${PROJECT_NAME} -l app=gitea -o jsonpath='{.items[0].metadata.name}' 2>/dev/null
}

case "$1" in
    status)
        check_project
        echo "Gitea Status:"
        echo "============="
        oc get pods -n ${PROJECT_NAME} -l app=gitea
        echo ""
        oc get deployment gitea -n ${PROJECT_NAME}
        echo ""
        echo "Route:"
        oc get route gitea -n ${PROJECT_NAME}
        ;;
    
    logs)
        check_project
        oc logs -f deployment/gitea -n ${PROJECT_NAME}
        ;;
    
    url)
        check_project
        GITEA_URL=$(oc get route gitea -n ${PROJECT_NAME} -o jsonpath='{.spec.host}' 2>/dev/null)
        if [ -n "$GITEA_URL" ]; then
            echo "Gitea URL: http://${GITEA_URL}"
        else
            echo "Error: Route not found"
            exit 1
        fi
        ;;
    
    list-users)
        check_project
        POD=$(get_pod)
        if [ -z "$POD" ]; then
            echo "Error: Gitea pod not found"
            exit 1
        fi
        echo "Gitea Users:"
        echo "============"
        oc exec ${POD} -n ${PROJECT_NAME} -- gitea admin user list -c /etc/gitea/app.ini
        ;;
    
    reset-password)
        check_project
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 reset-password <username> <new-password>"
            exit 1
        fi
        POD=$(get_pod)
        echo "Resetting password for user: $2"
        oc exec ${POD} -n ${PROJECT_NAME} -- gitea admin user change-password \
            --username $2 \
            --password $3 \
            -c /etc/gitea/app.ini
        echo "✅ Password reset complete"
        ;;
    
    delete-user)
        check_project
        if [ -z "$2" ]; then
            echo "Usage: $0 delete-user <username>"
            exit 1
        fi
        POD=$(get_pod)
        echo "Deleting user: $2"
        read -p "Are you sure? (y/n): " CONFIRM
        if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
            oc exec ${POD} -n ${PROJECT_NAME} -- gitea admin user delete \
                --username $2 \
                -c /etc/gitea/app.ini
            echo "✅ User deleted"
        else
            echo "Cancelled"
        fi
        ;;
    
    restart)
        check_project
        echo "Restarting Gitea..."
        oc rollout restart deployment/gitea -n ${PROJECT_NAME}
        oc rollout status deployment/gitea -n ${PROJECT_NAME}
        echo "✅ Gitea restarted"
        ;;
    
    backup)
        check_project
        POD=$(get_pod)
        BACKUP_DIR="gitea-backup-$(date +%Y%m%d-%H%M%S)"
        echo "Creating backup in: ${BACKUP_DIR}"
        mkdir -p ${BACKUP_DIR}
        
        echo "Backing up database..."
        oc exec ${POD} -n ${PROJECT_NAME} -- tar czf /tmp/gitea-data-backup.tar.gz /data
        oc cp ${PROJECT_NAME}/${POD}:/tmp/gitea-data-backup.tar.gz ${BACKUP_DIR}/gitea-data.tar.gz
        
        echo "Backing up configuration..."
        oc get configmap gitea-config -n ${PROJECT_NAME} -o yaml > ${BACKUP_DIR}/gitea-config.yaml
        
        echo "✅ Backup complete: ${BACKUP_DIR}"
        ;;
    
    shell)
        check_project
        POD=$(get_pod)
        echo "Opening shell in pod: ${POD}"
        oc exec -it ${POD} -n ${PROJECT_NAME} -- /bin/sh
        ;;
    
    *)
        show_help
        ;;
esac

