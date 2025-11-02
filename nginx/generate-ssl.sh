#!/bin/bash

# Generate self-signed SSL certificates for development
# For production, use Let's Encrypt with Certbot

mkdir -p ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo "SSL certificates generated successfully in ssl/"
