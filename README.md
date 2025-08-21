# PIXIO GEN-AI VIDEO EDITOR
[![Watch Demo](https://img.youtube.com/vi/3vgasqhx9SY/0.jpg)](https://youtu.be/3vgasqhx9SY?si=E3TrH8lpjZfax4Db)

This repository contains solutions and implementations for the IITISoC Machine Learning Track (Project 05). It is organized into several feature modules related to video and audio processing, leveraging state-of-the-art ML models.

## Features

- **Background Changer**
  - Change or remove video/image backgrounds using RobustVideoMatting ([PeterL1n/RobustVideoMatting](https://github.com/PeterL1n/RobustVideoMatting)).
  - Integrated Jupyter notebooks for background removal (see `features/background_changer/`).
  - Example setup:
    ```bash
    git clone https://github.com/PeterL1n/RobustVideoMatting.git
    cd RobustVideoMatting
    wget https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_resnet50.pth -O rvm_resnet50.pth
    pip install fastapi pyngrok uvicorn nest-asyncio python-multipart opencv-python ffmpeg-python av torch torchvision tqdm pims
    ```

- **Video Super Resolution**
  - Super-resolve videos using Real-ESRGAN ([xinntao/Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN)).
  - Example setup:
    ```bash
    git clone https://github.com/xinntao/Real-ESRGAN.git
    cd Real-ESRGAN
    wget -P experiments/pretrained_models https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth
    pip install -r requirements.txt
    python setup.py develop
    ```

- **Style Transfer**
  - Apply neural style transfer to images/videos with integrated workflow.
  - See notebooks in `features/style_transfer/`.

- **Voice Enhancement and Captioning**
  - Noise removal and voice enhancement for audio tracks.
  - Ready-to-use Colab notebooks with setup instructions.

- **Object Inpainting**
  - Remove or inpaint objects from images and videos using deep learning models.
  - Find demos and notebooks in `features/object_inpainting/`.

- **GIF Generator**
  - Generate GIFs from processed video or image sequences.
  - Ready-to-use utilities and notebooks available in `features/gif_generator/`.
    
- **Web Interface**
  - React + Vite frontend for demoing ML features (`web_dev/frontend/`).
  - Node + Express backend that utilises Prisma ORM + PostGRESQL as the DB
  - Cloudinary CDN configured for storage of videos.
  - ESLint and recommended plugins are pre-configured.
    
## Installation

Follow these steps to set up the project locally.

### 1. Clone the Repository
```bash
git clone https://github.com/rishabh-2005/IITISoC-ML-05
cd IITISoc-ML-05
```
### 2. Install Dependencies
Backend
```bash
cd ./web_dev/backend
npm install
```
Frontend
```bash
cd ./web_dev/frontend
npm install
```
### 3. Set Up Environment Variables
Create a .env file in the backend folder:
```
# Backend .env
JWT_SECRET_KEY=your_jwt_secret_key
DATABASE_URL=your_database_connection_string
CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```
### 4. Run the development servers
Backend
```bash
cd ./web_dev/backend
npx prisma generate
node server.js
```
Frontend
```bash
cd ./web_dev/frontend
npm run dev
```
### 5. Access the application
```bash
Backend API: http://localhost:3000
Frontend App: http://localhost:5173
```

## Technologies Used

- **Jupyter Notebook**
- **Python** (with libraries: torch, torchvision, tqdm, pims, ffmpeg-python, opencv-python, av, fastapi, uvicorn, nest-asyncio, python-multipart)
- **Machine Learning Models:** RobustVideoMatting, Real-ESRGAN, ProPainter, VoiceFixer ,OpenAI Whisper
- **React + Vite** (for frontend)
- **Node + Express.js** (for backend)
- **Prisma ORM + PostGRESQL (Neon DB)** (for database storage)
- **Cloudinary** (for cloud storage)
- **FFMPEG** (for exporting)
- **Ngrok** (for exposing local servers)

## Contributing

Feel free to open issues or submit pull requests for improvements or new features.


