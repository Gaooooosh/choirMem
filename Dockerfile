# Use official Python image as a base
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Upgrade pip
RUN pip install --upgrade pip -i https://mirrors.aliyun.com/pypi/simple/

# Copy requirements file and install dependencies
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/

# Copy all application code to the working directory
COPY . .

# Make entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# No need to expose port here, docker-compose handles it

# Set the entrypoint
CMD ["gunicorn", "-b", "0.0.0.0:1000", "--access-logfile", "-", "--error-logfile", "-", "run:app"]