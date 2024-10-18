# Earth 3D Visualization with Real-Time Satellites

This project is a 3D visualization of Earth using **Three.js**. It includes real-time satellite tracking and an interactive cloud shader. The visualization offers the ability to toggle different visual features, such as background, satellite markers, and dynamic cloud shading. The project uses data from **CelesTrak** to fetch satellite orbital data and visualize satellite positions in real-time.

<img width="1457" alt="Screenshot 2024-10-18 at 17 56 11" src="https://github.com/user-attachments/assets/b88717f9-aa8a-497f-a2b9-f6caefb26e0c">
<img width="1458" alt="Screenshot 2024-10-18 at 17 55 54" src="https://github.com/user-attachments/assets/0d4fb9db-8b10-40f0-844f-a9779e99983f">
<img width="1462" alt="Screenshot 2024-10-18 at 17 56 33" src="https://github.com/user-attachments/assets/cd97cd87-3bc5-4b02-b3ed-7974331b49fe">

## Features

- **3D Earth Model**: A rotating Earth model with day/night textures and bump mapping for surface details.
- **Cloud Shading**: Procedurally generated clouds using custom shaders with adjustable parameters for cloud scale, speed, cover, and tint.
- **Real-Time Satellites**: Visualize real-time satellite positions using CelesTrak's TLE data. Toggle between Starlink satellites, military satellites, research satellites, and more.
- **Satellite Trajectory**: Shows the full orbital trajectory of satellites when clicked.
- **Interactive Controls**: Easily toggle background, satellite markers, and cloud shader through buttons and sliders.

## Getting Started

### Prerequisites

- **Node.js**: Install [Node.js](https://nodejs.org/) (version 12 or later).
- **Three.js**: A 3D library for rendering the Earth and satellites.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/earth-3d-satellite-visualization.git
   cd earth-3d-satellite-visualization
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Start the development server:
    ```bash
    npm run dev
    ```
4. Open the browser and navigate to `http://localhost:5173`.

## Usage

Once the development server is running, you can interact with the 3D visualization through the browser. You will see:

- A rotating Earth model with day/night textures.
- Satellite markers representing real-time satellite positions.
- Cloud shading with adjustable parameters.
- Buttons to toggle background, satellite markers, and cloud shading.
- A slider to adjust cloud parameters.

### Satellite Indicators

When real-time satellites are visible, a legend appears explaining the colors used for different satellite types:

- **Yellow**: Starlink satellites.
- **Blue**: Communication satellites (e.g., DIRECTV, INTELSAT).
- **Green**: Military satellites.
- **Orange**: Research satellites.

### Cloud Shader Controls

The cloud shader offers a set of sliders to customize the cloud rendering in real-time:

- **Cloud Scale**: Adjust the size of the clouds.
- **Speed**: Control the movement speed of the clouds.
- **Cloud Light**: Adjust the brightness of the clouds.
- **Cloud Cover**: Control how much of the sky is covered by clouds.
- **Cloud Alpha**: Control cloud transparency.
- **Sky Tint**: Adjust the sky tint for a more realistic look.


## Technologies Used

- **Three.js**: A 3D library for rendering the Earth and satellites.
- **CelesTrak**: A website providing satellite orbital data.
- **satellite.js**: Library for calculating satellite positions from TLE data.
- **GLSL**: OpenGL Shading Language for custom shaders.
- **Node.js**: A JavaScript runtime for building the development server.
