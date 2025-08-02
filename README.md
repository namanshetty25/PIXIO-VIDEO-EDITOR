# IITISoC-ML-05

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

- **Web Frontend**
  - React + Vite frontend for demoing ML features (`web_dev/frontend/`).
  - ESLint and recommended plugins are pre-configured.

## Installation

Most features are implemented as Jupyter notebooks. To run them locally or in Colab:

1. Clone the repository:
    ```bash
    git clone https://github.com/rishabh-2005/IITISoC-ML-05.git
    cd IITISoC-ML-05
    ```
2. Open the required notebook in Jupyter or Colab.
3. Follow the setup cells in each notebook to install dependencies and download pre-trained models.

## Technologies Used

- **Jupyter Notebook**
- **Python** (with libraries: torch, torchvision, tqdm, pims, ffmpeg-python, opencv-python, av, fastapi, uvicorn, nest-asyncio, python-multipart)
- **Machine Learning Models:** RobustVideoMatting, Real-ESRGAN, ProPainter
- **React + Vite** (for frontend)
- **Ngrok** (for exposing local servers)

## Contributing

Feel free to open issues or submit pull requests for improvements or new features.


