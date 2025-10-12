# Use Red Hat Universal Base Image for OpenShift compatibility
FROM registry.access.redhat.com/ubi8/python-39:latest

# Set working directory
WORKDIR /app

# Switch to root to install system packages and set up directories
USER root

# Install system dependencies for SSH and networking
RUN yum update -y && \
    yum install -y openssh-clients && \
    yum clean all

# Create directory for database with proper permissions
RUN mkdir -p /app/data && \
    chown -R 1001:0 /app/data && \
    chmod -R 775 /app/data

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Copy application code
COPY app.py .
COPY templates/ templates/

# Set proper ownership for all app files
RUN chown -R 1001:0 /app && \
    chmod -R 775 /app

# Switch back to default user
USER 1001

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app
ENV DATABASE=/app/data/ctf_tracker.db

# Expose the port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Use gunicorn for production deployment
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "4", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
