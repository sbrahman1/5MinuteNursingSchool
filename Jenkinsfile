pipeline {
    agent any

    environment {
        IMAGE_NAME = "shams43/react-shams"
    }

    stages {
        stage('Checkout') {
            steps {
                // Checkout code from GitHub using the GitHub token
                git branch: 'main', credentialsId: 'github-token', url: 'https://github.com/sbrahman1/finaldevops.git'
            }
        }
        stage('Build Docker Image') {
            steps {
                // Needed to Change directory /react-shams into the react-shams folder where the Dockerfile exists
                dir('react-shams') {
                    script {
                        // Create a dynamic image tag: pipeline_BUILDNUMBER-day-month-hour-minute
                        def buildNum = env.BUILD_NUMBER
                        def dateTag = sh(script: "date '+%d-%m-%H-%M'", returnStdout: true).trim()
                        def imageTag = "pipeline_${buildNum}-${dateTag}"
                        env.IMAGE_TAG = imageTag

                        // Build the Docker image with the dynamic tag
                        sh "docker build -t ${IMAGE_NAME}:${imageTag} ."
                    }
                }
            }
        }
        stage('Push Docker Image') {
            steps {
                // Using Jenkins credentials (ID 'dockerhub') to log into Docker Hub
                withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    script {
                        sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                        // Push the newly built image
                        sh "docker push ${IMAGE_NAME}:${env.IMAGE_TAG}"
                        sh "docker logout"
                    }
                }
            }
        }
        stage('Clean Workspace') {
            steps {
                // Remove any temporary files from the workspace
                cleanWs()
            }
        }
        stage('Update Docker Compose') {
            steps {
                script {
                    // Update the image tag in the docker-compose.yml file located at /var/www/app/finaldevops/react-shams
                    sh "sed -i 's|image: shams43/react-shams:.*|image: ${IMAGE_NAME}:${env.IMAGE_TAG}|' /var/www/app/finaldevops/react-shams/docker-compose.yml"
                    
                    // Restart Docker Compose so the container picks up the new image
                    dir('/var/www/app/finaldevops/react-shams') {
                        sh "docker compose down"
                        sh "docker compose up -d"
                    }
                }
            }
        }
        stage('Notification') {
            steps {
                script {
                    // Send a Google Chat notification with the updated image tag
                    sh """
                      curl -X POST -H "Content-Type: application/json" \
                      -d '{ "text": "your application has been updated, Imagename:${IMAGE_NAME}:${env.IMAGE_TAG}" }' \
                      "https://chat.googleapis.com/v1/spaces/AAAA6gesZ6E/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=FNPvshnsRfSwXa3s2kl3XnCBEob8oYLpMI04PUjpvAs"
                    """
                }
            }
        }
    }
    post {
        always {
            // Clean up unused Docker resources after the pipeline run
            sh "docker system prune -f"
        }
    }
}
