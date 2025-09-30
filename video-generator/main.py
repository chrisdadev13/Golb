import modal
from datetime import datetime

# Create a Modal app
app = modal.App("manim-course-generator")

# Define the image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "ffmpeg", 
        "libcairo2-dev", 
        "libpango1.0-dev", 
        "texlive", 
        "texlive-latex-extra",
        "sox",
    )
    .pip_install(
        "manim", 
        "manim-voiceover[elevenlabs,transcribe]",
        "boto3",
        "fastapi[standard]",
        "google-generativeai",
    )
)

# Placeholder - replace with your actual system prompt
SYSTEM_PROMPT = """
You are an expert at creating educational Manim animations with voiceovers for STEM subjects (Science, Technology, Engineering, Mathematics).

Given course content about ANY STEM topic (mathematics, physics, chemistry, biology, computer science, engineering, statistics, etc.), generate Python code for a Manim scene that:
1. Creates visual animations explaining the concepts clearly
2. Uses voiceover text synchronized with the animations
3. Uses appropriate visual metaphors and representations for the subject matter
4. **CRITICAL: The total video duration MUST be approximately 60 seconds, regardless of content length**

VISUAL REPRESENTATIONS BY SUBJECT:
- **Mathematics**: Use equations (MathTex), graphs, geometric shapes, number lines, coordinate systems
- **Physics**: Show forces as arrows, particles as circles, waves, motion paths, vector fields
- **Chemistry**: Molecules as connected circles, reactions as transformations, electron configurations
- **Biology**: Cell structures, DNA helixes, organ systems, evolutionary trees
- **Computer Science**: Arrays as rectangles, trees as nodes with edges, algorithms as step-by-step animations
- **Engineering**: Diagrams, circuits, mechanical systems, flowcharts

CODE STRUCTURE:
```python
class CourseScene(VoiceoverScene):
    def construct(self):
        self.set_speech_service(
            ElevenLabsService(
                voice_id="KHla1Z0y3pZPYrqfub7h",
                voice_settings={"stability": 0.001, "similarity_boost": 0.25},
                transcription_model=None,
            )
        )
        
        # Your animation code here with voiceovers
        # Example:
        with self.voiceover(text="Clear explanation of what's happening") as tracker:
            self.play(SomeAnimation(), run_time=tracker.duration)
```

IMPORTANT RULES:

60-SECOND CONSTRAINT: Condense ALL provided content into a 60-second video. Prioritize the most important concepts and skip secondary details if needed.
Use clear, engaging voiceover text that explains concepts at an appropriate level
Create visual representations that match the subject (use MathTex for equations, shapes for diagrams, etc.)
Each voiceover should be 1-2 sentences max for clarity
Available Manim objects: Circle, Square, Rectangle, Text, MathTex, Tex, Arrow, Line, Dot, VGroup, NumberLine, Axes, etc.
Available colors: RED, BLUE, GREEN, YELLOW, PINK, PURPLE, ORANGE, WHITE, BLACK, GRAY, etc.
Available animations: Create, FadeIn, FadeOut, Transform, Write, GrowFromCenter, etc.
For math: Use MathTex("E = mc^2") for equations, Axes() for graphs
For physics: Use Arrow() for vectors/forces, Dot() for particles
Keep animations smooth, educational, and visually appealing
Start with a title screen introducing the topic
End with a summary or conclusion
ONLY return the Python code for the CourseScene class, nothing else
Do NOT include markdown code fences, explanations, or comments outside the code
"""

@app.function(
    image=image,
    secrets=[
        modal.Secret.from_name("elevenlabs-api-key"),
        modal.Secret.from_name("r2-credentials"),
        modal.Secret.from_name("gemini-api-key")
    ],
    timeout=900,
)
def generate_and_render_video(course_data: dict):
    import os
    import boto3
    import google.generativeai as genai
    from manim import config
    from manim_voiceover import VoiceoverScene
    from manim_voiceover.services.elevenlabs import ElevenLabsService
    
    # Set up API keys
    if "ELEVENLABS_API_KEY" in os.environ:
        os.environ["ELEVEN_API_KEY"] = os.environ["ELEVENLABS_API_KEY"]
    
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    
    # Prepare course content for Gemini
    title = course_data.get("title", "Course")
    blocks = course_data.get("blocks", [])
    subject = course_data.get("subject", "")
    
    course_content = f"Title: {title}\n"
    if subject:
        course_content += f"Subject: {subject}\n\n"
    
    for i, block in enumerate(blocks, 1):
        course_content += f"Block {i}:\n{block}\n\n"
    
    print(f"Generating Manim code for: {title}")
    
    # Generate Manim code using Gemini
    model = genai.GenerativeModel('gemini-2.5-pro')
    prompt = f"{SYSTEM_PROMPT}\n\nCourse Content:\n{course_content}\n\nGenerate the CourseScene class code:"
    
    response = model.generate_content(prompt, generation_config=genai.types.GenerationConfig(
        temperature=0.3,  # Lower temperature = more consistent
    ))
    manim_code = response.text.strip()
    
    # Clean up the code (remove markdown if present)
    if "```python" in manim_code:
        manim_code = manim_code.split("```python")[1].split("```")[0].strip()
    elif "```" in manim_code:
        manim_code = manim_code.split("```")[1].split("```")[0].strip()
    
    print("Generated Manim code:")
    print(manim_code)
    
    # Save generated code for debugging
    with open("/tmp/generated_code.py", "w") as f:
        f.write(manim_code)
    
    # Execute the generated code to create the scene class
    exec_globals = {
        'VoiceoverScene': VoiceoverScene,
        'ElevenLabsService': ElevenLabsService,
    }
    
    # Import all Manim components
    exec("from manim import *", exec_globals)
    
    try:
        exec(manim_code, exec_globals)
    except Exception as e:
        print(f"Error executing generated code: {e}")
        print(f"Generated code:\n{manim_code}")
        raise Exception(f"Failed to execute generated Manim code: {e}")
    
    # Find the scene class
    scene_class = exec_globals.get('CourseScene')
    if not scene_class:
        raise Exception("Generated code must define a class named 'CourseScene'")
    
    print("Rendering Manim scene...")
    config.media_dir = "/tmp/manim"
    config.output_file = "output"
    
    scene = scene_class()
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
    
    # Generate filename from title
    safe_title = "".join(c if c.isalnum() else "_" for c in title).lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    r2_filename = f"videos/{safe_title}_{timestamp}.mp4"
    
    with open(video_path, "rb") as video_file:
        s3_client.upload_fileobj(
            video_file,
            os.environ["R2_STORAGE_BUCKET_NAME"],
            r2_filename,
            ExtraArgs={'ContentType': 'video/mp4'}
        )
    
    print(f"✓ Uploaded to R2: {r2_filename}")
    
    r2_url = f"{os.environ['R2_STORAGE_BASE_URL']}/{r2_filename}"
    
    return {
        "r2_url": r2_url,
        "r2_filename": r2_filename,
        "status": "success",
        "message": "Video generated and uploaded successfully!"
    }

@app.function(
    image=image,
    secrets=[
        modal.Secret.from_name("elevenlabs-api-key"),
        modal.Secret.from_name("r2-credentials"),
        modal.Secret.from_name("gemini-api-key"),
        modal.Secret.from_name("api-auth-key")
    ],
)
@modal.asgi_app()
def fastapi_app():
    import os 
    from fastapi import FastAPI, HTTPException, Header
    from fastapi.middleware.cors import CORSMiddleware
    from typing import Optional
    
    web_app = FastAPI(title="Manim Course Video Generator")
    
    # Enable CORS
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def verify_api_key(x_api_key: Optional[str] = Header(None)):
        if not x_api_key:
            raise HTTPException(status_code=401, detail="API key is missing")
        
        # Get the valid API key from environment
        valid_api_key = os.environ.get("API_AUTH_KEY")
        
        if x_api_key != valid_api_key:
            raise HTTPException(status_code=403, detail="Invalid API key")
        
        return x_api_key
    
    @web_app.post("/generate")
    async def generate_course_video(data: dict, api_key: str = Header(..., alias="X-API-Key")):
        """
        Generate educational video from course content summary
        
        Expected body:
        {
            "title": "Introduction to Arrays",
            "subject": "Computer Science",
            "blocks": [
                "Block 1 content...",
                "Block 2 content...",
                ...
            ]
        }
        """
        verify_api_key(api_key)

        try:
            if "title" not in data or "blocks" not in data:
                raise HTTPException(
                    status_code=400, 
                    detail="Missing required fields: 'title' and 'blocks'"
                )
            
            result = generate_and_render_video.remote(data)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @web_app.get("/health")
    async def health(api_key: str = Header(..., alias="X-API-Key")):
        verify_api_key(api_key)
        return {"status": "healthy"}
    
    return web_app

"""
Use for testing purposes with uvx modal run main.py
"""
@app.local_entrypoint()
def main():
    result = generate_and_render_video.remote({
        "title": "Introduction to Arrays",
        "subject": "Computer Science",
        "blocks": [
            "Arrays are fundamental data structures.",
            "You can perform insertion and deletion operations."
        ]
    })
    
    print(f"\n✓ {result['message']}")
    print(f"✓ Title: {result['title']}")
    print(f"✓ R2 URL: {result['r2_url']}")