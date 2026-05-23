# AirWriter

Hey there! Welcome to AirWriter, a cool spatial drawing project that lets you write and paint in mid-air using just your webcam and hand gestures. 

This is a B.Tech Computer Science project built to explore real-time computer vision and interactive canvas rendering right in the browser.

## What is it?

AirWriter uses your computer webcam to track your hand gestures in real time. By moving your hand in front of the camera, you can draw calligraphy strokes on the screen, erase lines, change colors, and save your work as a PNG image. There are no corporate widgets, no clutter, and no complex settings, just a clean canvas and simple controls.

## Features

- **Calligraphy Brush**: Draws smooth, angled flat-chisel strokes that look like real calligraphy.
- **Air Buttons**: Hover your cursor over the buttons at the top of the canvas for 1.2 seconds to clear, toggle the eraser, undo, or save without touching your mouse.
- **Augmented Mirror**: Draw directly on top of your webcam stream to write in space, or switch to dark space mode if you prefer a clean black background.
- **Audio Feedback**: Built-in sound synthesizers make a low hum that changes pitch based on your finger height as you draw.

## How to use the gestures

We have built two simple control modes that you can choose from in the Setup tab:

1. **Point Write**: Raise your index finger and fold the rest of your fingers (like holding a virtual pencil) to draw. Open your hand flat to hover and move the cursor without drawing.
2. **Pinch Write**: Pinch your index finger and thumb together to draw. Release the pinch to hover.

## Tech Stack

We kept it simple and lightweight:
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, and TailwindCSS for clean layouts.
- **Tracking Engine**: MediaPipe Hands API (loaded via CDN) to track 21 hand landmarks in real time.
- **Audio Synthesizer**: Web Audio API for interactive sound feedback.

## Setup and Running Locally

Running the project is super easy:

1. Clone this repository to your local machine.
2. Open a terminal in the project directory.
3. Start a local server. For example, if you have Python installed, run:
   ```bash
   python -m http.server 8080
   ```
4. Open your browser and go to `http://localhost:8080`.
5. Grant camera permission, click **Enable Camera & Start**, and start drawing!

---

Made By - Keshav Raj
DTU'29
