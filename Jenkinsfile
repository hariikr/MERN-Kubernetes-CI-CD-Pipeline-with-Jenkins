pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'hariikr'
        IMAGE_TAG = "${BUILD_NUMBER}"
        KUBERNETES_SERVER = 'https://kubernetes.default.svc'
    }

    tools {
        git 'Default'           // Make sure Git is configured in Jenkins global tools
        nodejs 'NodeJS_20'      // NodeJS plugin installation in Jenkins
    }

    stages {
        stage('Checkout') {
            steps {
                // Use actual GitHub credentials configured in Jenkins
                git branch: 'main',
                    url: 'https://github.com/hariikr/MERN-Kubernetes-CI-CD-Pipeline-with-Jenkins.git',
                    credentialsId: 'git' 
            }
        }

        stage('Install & Test Backend') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm test'
                }
            }
        }

        stage('Install & Test Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm test -- --coverage --watchAll=false'
                }
            }
        }

        stage('Build & Push Docker Images') {
            parallel {
                stage('Backend Image') {
                    steps {
                        dir('backend') {
                            script {
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
                        dir('frontend') {
                            script {
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
                    echo '🔍 Verifying Kubernetes API...'
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
                    """
                    sh 'kubectl apply -f k8s/'
                    sh 'kubectl rollout status deployment/backend-deployment'
                    sh 'kubectl rollout status deployment/frontend-deployment'
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
        success { echo '🎉 Pipeline completed successfully!' }
        failure { echo '❌ Pipeline failed!' }
        always {
            script {
                // Only run Docker cleanup if Docker is available
                if (fileExists('/usr/bin/docker') || fileExists('/usr/local/bin/docker')) {
                    sh 'docker system prune -f'
                } else {
                    echo '⚠️ Docker not found, skipping cleanup'
                }
            }
        }
    }
}
