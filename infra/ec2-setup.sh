#!/bin/bash
# EC2 t2.micro setup script (Ubuntu 22.04)
# Run as: sudo bash ec2-setup.sh

set -euo pipefail

# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin

# Install Nginx
apt-get install -y nginx
systemctl enable nginx

# Setup swap (t2.micro has only 1GB RAM)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Create app directory
mkdir -p /home/ubuntu/fincheck-api
chown ubuntu:ubuntu /home/ubuntu/fincheck-api

# Copy Nginx config
cp /home/ubuntu/fincheck-api/infra/nginx.conf /etc/nginx/sites-available/fincheck
ln -sf /etc/nginx/sites-available/fincheck /etc/nginx/sites-enabled/fincheck
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "Setup complete. Next steps:"
echo "1. Copy .env to /home/ubuntu/fincheck-api/.env"
echo "2. Copy docker-compose.prod.yml to /home/ubuntu/fincheck-api/"
echo "3. docker compose -f docker-compose.prod.yml up -d"
