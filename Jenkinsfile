pipeline {
    agent any
    tools {
        // This should match the NodeJS installation name in Jenkins (configured via Global Tool Configuration)
        nodejs "Nodejs 20.x"
    }
    environment {
        NODE_ENV = 'production'
        ENV_FILE = credentials('cbs-backend') // replace with your credential ID
    }
    stages {
        stage('Prepare Environment') {
            steps {
                script {
                    // Use the secret file credential
                    def envFile = 'cbs-backend' // Use the ID you set for your secret file
                    // Unpack the secret file to the workspace
                    withCredentials([file(credentialsId: envFile, variable: 'ENV_FILE')]) {
                        // Write the contents of the secret file to .env
                        writeFile file: '.env', text: readFile(ENV_FILE)
                    }

                    // Optionally, you can print the contents of the .env file for debugging
                    echo "Loaded .env file contents:"
                    bat 'type .env' // Use 'type' instead of 'cat' on Windows
                }
            }
        }
        
        stage('Clone repository') {
            steps {
                // Cloning the repository from GitHub
                git url: 'https://github.com/XyvinTech/cbs-counseling-backend.git', branch: 'main'
            }
        }
        stage('Install dependencies') {
            steps {
                // Running npm install to install dependencies (Windows uses 'bat' instead of 'sh')
                bat 'npm install'
            }
        }
        // stage('Stop Application') {
        //      steps {
        //         bat 'pm2 stop app.js || echo "No existing process to stop."'
        //     }
        // }
        stage('Start application') {
            steps {
                // Start the application
                bat 'npm start'
            }
        }
    }
    post {
        // always {
        //     script {
        //         try {
        //             cleanWs()
        //         } catch (Exception e) {
        //             echo "Cleanup failed: ${e.getMessage()}"
        //         }
        //     }
        // }
        failure {
            // Notify if the build fails
            echo "Build failed!"
        }
        success {
            // Notify if the build succeeds
            echo "Build succeeded!"
        }
    }
}
