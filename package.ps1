#!/usr/bin/env pwsh

Set-StrictMode -Version latest
$ErrorActionPreference = "Stop"

# Get component metadata and set necessary variables
$component = Get-Content -Path "$PSScriptRoot/component.json" | ConvertFrom-Json
$rcImage = "$($component.registry)/$($component.name):$($component.version)-$($component.build)"
$latestImage = "$($component.registry)/$($component.name):latest"

# Copy private keys to access git repo
if (-not (Test-Path -Path "$PSScriptRoot/docker/id_rsa")) {
    if (-not [string]::IsNullOrEmpty($env:GIT_PRIVATE_KEY)) {
        Write-Host "Creating docker/id_rsa from environment variable..."
        Set-Content -Path "$PSScriptRoot/docker/id_rsa" -Value $env:GIT_PRIVATE_KEY
    }
    elseif (Test-Path -Path "~/.ssh/id_rsa") {
        Write-Host "Copying ~/.ssh/id_rsa to docker..."
        Copy-Item -Path "~/.ssh/id_rsa" -Destination "docker"
    }
    else {
        Write-Host "Missing ~/.ssh/id_rsa file..."
        Set-Content -Path "$PSScriptRoot/docker/id_rsa" -Value ""
    }
}

# Copy .npmrc to docker folder to use it inside container
if (-not (Test-Path -Path "$PSScriptRoot/docker/.npmrc")) {
    if (-not [string]::IsNullOrEmpty($env:NPM_TOKEN)) {
        Write-Host "Creating docker/.npmrc from environment variable..."
        Set-Content -Path "$PSScriptRoot/docker/.npmrc" -Value "//registry.npmjs.org/:_authToken=$($env:NPM_TOKEN)"
    }
    elseif (Test-Path -Path "~/.npmrc") {
        Write-Host "Copying ~/.npmrc to docker..."
        Copy-Item -Path "~/.npmrc" -Destination "docker" 
    }
    else {
        Write-Host "Missing ~/.npmrc file..."
        Set-Content -Path "$PSScriptRoot/docker/.npmrc" -Value ""
    }
}

# Build docker image
docker build -f "$PSScriptRoot/docker/Dockerfile" -t $rcImage -t $latestImage .
if ($LastExitCode -eq 0) {
    Write-Host "`nBuilded run images:`n$rcImage`n$latestImage`n"
}

# Set environment variables
$env:IMAGE = $rcImage

# Set docker ip
if ($env:DOCKER_IP -ne $null) {
    $dockerMachineIp = $env:DOCKER_IP
}
else {
    $dockerMachineIp = "localhost"
}

# Set http port if default value overwritten
if ($env:HTTP_PORT -ne $null) {
    $httpPort = $env:HTTP_PORT
}
else {
    $httpPort = "8080"
}

# Set http route to test container
if ($env:HTTP_ROUTE -ne $null) {
    $httpRoute = $env:HTTP_ROUTE
}
else {
    $httpRoute = "/heartbeat"
}

try {
    # Workaround to remove dangling images
    docker-compose -f "$PSScriptRoot/docker/docker-compose.yml" down

    docker-compose -f "$PSScriptRoot/docker/docker-compose.yml" up -d

    # Test using curl
    Start-Sleep -Seconds 10
    Invoke-WebRequest -Uri "http://$dockerMachineIp`:$httpPort$httpRoute"

    if ($LastExitCode -eq 0) {
        Write-Host "The run container was successfully built and tested."
    }
}   
catch {
    # Output container logs if web request failed
    $containersStatuses = docker-compose -f "$PSScriptRoot/docker/docker-compose.yml" ps
    # Parse docker-compose list of containers
    foreach ($containerStatus in $containersStatuses | Select -Skip 2) {
        $containerName = $containerStatus.split(" ")[0]
        Write-Host "`nLogs of '$containerName' container:"
        docker logs $containerName
    }
    
    Write-Error "Error on testing run container. Watch logs above"
}
finally {
    # Workaround to remove dangling images
    docker-compose -f "$PSScriptRoot/docker/docker-compose.yml" down
}
