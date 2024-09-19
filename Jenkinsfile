pipeline {
    agent any
    tools {
        // This should match the NodeJS installation name in Jenkins (configured via Global Tool Configuration)
        nodejs "Node.js 20.x"
    }
    environment {
        NODE_ENV = 'production'
    }
    stages {
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
        // stage('Run tests') {
        //     steps {
        //         // Run tests if any
        //         bat 'npm test'
        //     }
        // }
        // stage('Build project') {
        //     steps {
        //         // Build process if any
        //         bat 'npm run build'
        //     }
        // }
        stage('Start application') {
            steps {
                // Start the application
                bat 'npm run dev'
            }
        }
    }
    post {
        always {
            echo 'Build process completed'
        }
    }
}
