#!/usr/bin/env groovy

import java.text.SimpleDateFormat

node {
  properties([
    [$class: 'ScannerJobProperty', doNotScan: false],
    [$class: 'RebuildSettings', autoRebuild: false, rebuildDisabled: false],
    pipelineTriggers([pollSCM('* * * * *')])
  ])

  stage('Checkout project') {
    checkout([
      $class: 'GitSCM',
      branches: [[name: '*/qa']],
      doGenerateSubmoduleConfigurations: false,
      extensions: [],
      submoduleCfg: [],
      userRemoteConfigs: [[
        credentialsId: '4bc2ebb9-fdaa-490c-be12-5f5810f5c58a',
        url: 'git@bitbucket.org:ItsNever2Late/olympusportal.git'
      ]]
    ])
  }

  stage('Trigger QA Build & Deploy') {
    build job: 'BuildDeploy_Portal', parameters: [string(name: 'DEPLOY_ENV', value: 'qa'), string(name: 'VERSION', value: '')]
  }
}
