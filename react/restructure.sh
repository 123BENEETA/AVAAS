#!/bin/bash

# Create main directories
mkdir -p frontend/public
mkdir -p frontend/src/{assets,components,contexts,hooks,services,pages,styles,utils}
mkdir -p frontend/src/components/{Audio,Auth,UI,Speech,Visualization}

mkdir -p backend/config
mkdir -p backend/controllers
mkdir -p backend/models
mkdir -p backend/routes
mkdir -p backend/middleware
mkdir -p backend/services
mkdir -p backend/utils
mkdir -p backend/websocket
mkdir -p backend/python

mkdir -p shared/{uploads,public/audio}

echo "Directory structure created successfully!"
