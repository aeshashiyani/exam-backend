# Elastic Beanstalk Deployment Preparation
# Run this script from the project ROOT directory before deploying to EB

echo "Step 1: Building React frontend..."
cd frontend
npm run build

echo "Step 2: Copying build folder to backend/public..."
# Remove old public folder if it exists
if exist "..\backend\public" rmdir /s /q "..\backend\public"
xcopy /e /i build "..\backend\public"

echo "Done! Now zip the backend folder (without node_modules and .env) and upload to Elastic Beanstalk."
