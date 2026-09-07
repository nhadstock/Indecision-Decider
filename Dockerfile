# Stage 1: Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ .
RUN npm run build

# Stage 2: Serve with FastAPI
FROM python:3.12-slim
WORKDIR /app

# Install backend dependencies
# Note: You will need to create a requirements.txt file in your backend folder!
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ /app/backend/

# Copy the built React UI from Stage 1 into the backend's static folder
COPY --from=frontend-builder /app/frontend/dist /app/backend/static

# Expose port and run Uvicorn
EXPOSE 8000
WORKDIR /app/backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]