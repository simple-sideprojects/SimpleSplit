#!/bin/bash

# Clear the PUBLIC_ADAPTER variable
sed -i '/^PUBLIC_ADAPTER/d' .env

# Set the PUBLIC_ADAPTER variable
echo "PUBLIC_ADAPTER=static" >> .env

# Build the app
pnpm build:static
