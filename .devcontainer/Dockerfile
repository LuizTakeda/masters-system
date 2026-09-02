FROM node:24-bookworm

# Install basic dev utilities, ca-certificates, and git
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    procps \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

# Enable corepack and pin exact pnpm version (11.17.0)
RUN corepack enable && corepack prepare pnpm@11.17.0 --activate

ENV PNPM_HOME="/home/node/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /workspace

