pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'hariikr'
        IMAGE_TAG = "${BUILD_NUMBER}"
        KUBERNETES_SERVER = 'https://kubernetes.default.svc'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/hariikr/MERN-Kubernetes-CI-CD-Pipeline-with-Jenkins.git',
                    credentialsId: 'git'
            }
        }

        stage('Install Dependencies & Test Backend') {
            steps {
                dir('backend') {
                    sh '''
                        # Check if npm is available
                        if command -v npm &> /dev/null; then
                            npm install
                            npm test
                        else
                            echo "Node.js/npm not found. Please ensure Node.js is installed on Jenkins agent."
                            exit 1
                        fi
                    '''
                }
            }
        }

        stage('Install Dependencies & Test Frontend') {
            steps {
                dir('frontend') {
                    sh '''
                        # Check if npm is available
                        if command -v npm &> /dev/null; then
                            npm install
                            npm test -- --coverage --watchAll=false
                        else
                            echo "Node.js/npm not found. Please ensure Node.js is installed on Jenkins agent."
                            exit 1
                        fi
                    '''
                }
            }
        }

        stage('Build & Push Docker Images') {
            parallel {
                stage('Backend Image') {
                    steps {
                        script {
                            // Check if Docker is available
                            def dockerAvailable = sh(script: 'command -v docker', returnStatus: true) == 0
                            if (!dockerAvailable) {
                                error "Docker is not available on this Jenkins agent. Please ensure Docker is installed and accessible."
                            }
                            
                            dir('backend') {
                                def backendImage = docker.build("${DOCKER_REGISTRY}/mern-backend:${IMAGE_TAG}")
                                docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                                    backendImage.push()
                                    backendImage.push('latest')
                                }
                            }
                        }
                    }
                }

                stage('Frontend Image') {
                    steps {
                        script {
                            // Check if Docker is available
                            def dockerAvailable = sh(script: 'command -v docker', returnStatus: true) == 0
                            if (!dockerAvailable) {
                                error "Docker is not available on this Jenkins agent. Please ensure Docker is installed and accessible."
                            }
                            
                            dir('frontend') {
                                def frontendImage = docker.build("${DOCKER_REGISTRY}/mern-frontend:${IMAGE_TAG}")
                                docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                                    frontendImage.push()
                                    frontendImage.push('latest')
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Verify Kubernetes Connectivity') {
            steps {
                script {
                    // Check if kubectl is available
                    def kubectlAvailable = sh(script: 'command -v kubectl', returnStatus: true) == 0
                    if (!kubectlAvailable) {
                        error "kubectl is not available on this Jenkins agent. Please ensure kubectl is installed and configured."
                    }
                    
                    echo '🔍 Verifying Kubernetes API (In-cluster ServiceAccount)...'
                    sh 'kubectl cluster-info'
                    sh 'kubectl get nodes -o wide'
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    sh """
                        sed -i 's|your-registry/mern-backend:latest|${DOCKER_REGISTRY}/mern-backend:${IMAGE_TAG}|g' k8s/backend-deployment.yaml
                        sed -i 's|your-registry/mern-frontend:latest|${DOCKER_REGISTRY}/mern-frontend:${IMAGE_TAG}|g' k8s/frontend-deployment.yaml
                        kubectl apply -f k8s/
                        kubectl rollout status deployment/backend-deployment
                        kubectl rollout status deployment/frontend-deployment
                    """
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    sh 'kubectl get pods -o wide'
                    sh 'kubectl get services'
                    sh 'kubectl wait --for=condition=ready pod -l app=backend --timeout=300s'
                    sh 'kubectl wait --for=condition=ready pod -l app=frontend --timeout=300s'
                }
            }
        }
    }

    post {
        success { 
            echo '🎉 Pipeline completed successfully!' 
        }
        failure { 
            echo '❌ Pipeline failed!' 
        }
        always { 
            script {
                try {
                    sh 'docker system prune -f'
                } catch (Exception e) {
                    echo "Docker cleanup failed: ${e.getMessage()}"
                }
            }
        }
    }
}
