# Multi-stage build for production

# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY ./app ./app
COPY ./alembic ./alembic
COPY ./alembic.ini .
COPY ./scripts ./scripts

# Make sure scripts are executable
RUN chmod +x /app/scripts/*.py 2>/dev/null || true

# Update PATH
ENV PATH=/root/.local/bin:$PATH

# Create data directory
RUN mkdir -p /app/data

EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
