import modal
from datetime import datetime

# Create a Modal app
app = modal.App("manim-voiceover-video")

# Define the image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "ffmpeg", 
        "libcairo2-dev", 
        "libpango1.0-dev", 
        "texlive", 
        "texlive-latex-extra",
        "sox"
    )
    .pip_install(
        "manim", 
        "manim-voiceover[elevenlabs,transcribe]",
        "boto3",
        "fastapi[standard]"
    )
)

@app.function(
    image=image,
    secrets=[
        modal.Secret.from_name("elevenlabs-api-key"),
        modal.Secret.from_name("r2-credentials")
    ],
    timeout=600,
)
def create_video(scene_text: dict):
    import os
    import boto3
    from manim import Circle, Square, Create, Transform, Uncreate, RIGHT, LEFT, config
    from manim_voiceover import VoiceoverScene
    
    # Set the environment variable that manim-voiceover expects
    if "ELEVENLABS_API_KEY" in os.environ:
        os.environ["ELEVEN_API_KEY"] = os.environ["ELEVENLABS_API_KEY"]
    
    from manim_voiceover.services.elevenlabs import ElevenLabsService
    
    class ElevenLabsExample(VoiceoverScene):
        def construct(self):
            self.set_speech_service(
                ElevenLabsService(
                    voice_name="Adam",
                    voice_settings={"stability": 0.001, "similarity_boost": 0.25},
                    transcription_model=None,
                )
            )
            circle = Circle()
            square = Square().shift(2 * RIGHT)
            
            # Get voiceovers from input or use defaults
            voiceovers = scene_text.get("voiceovers", [
                "This circle is drawn as I speak.",
                "Let's shift it to the left 2 units.",
                "Now, let's transform it into a square.",
                "Thank you for watching."
            ])
            
            with self.voiceover(text=voiceovers[0]) as tracker:
                self.play(Create(circle), run_time=tracker.duration)
            
            with self.voiceover(text=voiceovers[1]) as tracker:
                self.play(circle.animate.shift(2 * LEFT), run_time=tracker.duration)
            
            with self.voiceover(text=voiceovers[2]) as tracker:
                self.play(Transform(circle, square), run_time=tracker.duration)
            
            with self.voiceover(text=voiceovers[3]):
                self.play(Uncreate(circle))
            
            self.wait()
    
    # Render the Manim video with voiceover
    print("Rendering Manim scene with voiceover...")
    config.media_dir = "/tmp/manim"
    config.output_file = "output"
    
    scene = ElevenLabsExample()
    scene.render()
    
    video_path = f"{config.media_dir}/videos/1080p60/output.mp4"
    print(f"Reading video from: {video_path}")
    
    # Upload to R2
    print("Uploading to Cloudflare R2...")
    s3_client = boto3.client(
        's3',
        endpoint_url=os.environ["R2_STORAGE_ENDPOINT"],
        aws_access_key_id=os.environ["R2_STORAGE_ACCESS_KEY"],
        aws_secret_access_key=os.environ["R2_STORAGE_SECRET_KEY"],
        region_name='auto'
    )
    
    # Generate unique filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    r2_filename = f"videos/manim_{timestamp}.mp4"
    
    # Upload the file
    with open(video_path, "rb") as video_file:
        s3_client.upload_fileobj(
            video_file,
            os.environ["R2_STORAGE_BUCKET_NAME"],
            r2_filename,
            ExtraArgs={'ContentType': 'video/mp4'}
        )
    
    print(f"✓ Uploaded to R2: {r2_filename}")
    
    # Generate public URL
    r2_url = f"{os.environ['R2_STORAGE_BASE_URL']}/{r2_filename}"
    
    return {
        "r2_url": r2_url,
        "r2_filename": r2_filename,
        "status": "success",
        "message": "Video generated and uploaded to R2 successfully!"
    }

# Web endpoint for frontend - note the image parameter here too
@app.function(
    image=image,  # Add the image here!
    secrets=[
        modal.Secret.from_name("elevenlabs-api-key"),
        modal.Secret.from_name("r2-credentials")
    ],
)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI
    
    web_app = FastAPI()
    
    @web_app.post("/generate")
    async def generate_video_endpoint(data: dict):
        """
        API endpoint callable from frontend
        POST body: {
            "voiceovers": ["text1", "text2", "text3", "text4"]
        }
        """
        result = create_video.remote(data)
        return result
    
    return web_app

# Optional: local test entrypoint
@app.local_entrypoint()
def main():
    result = create_video.remote({
        "voiceovers": [
            "This circle is drawn as I speak.",
            "Let's shift it to the left 2 units.",
            "Now, let's transform it into a square.",
            "Thank you for watching."
        ]
    })
    
    print(f"\n✓ {result['message']}")
    print(f"✓ R2 Location: {result['r2_filename']}")
    print(f"✓ R2 URL: {result['r2_url']}")