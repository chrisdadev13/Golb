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
CRITICAL CONSTRAINT: DO NOT use SVGMobject or any external SVG files. Only use built-in Manim objects.
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

API USAGE CONSTRAINTS - FOLLOW EXACTLY:
- NEVER use .get_part_by_tex() with 'index' parameter - it does NOT accept this argument
- To select parts of MathTex/Tex: use indexing like equation[0], equation[1:3], etc.
- DO NOT use get_parts_by_tex() with index parameter
- Correct way to reference parts: my_tex[0], my_tex[1], my_tex[-1]
- Correct way to find by tex: my_tex.get_part_by_tex("x") (no index parameter!)
- When highlighting parts of equations, use direct indexing or get_part_by_tex WITHOUT index
- Example: equation.get_part_by_tex("E") NOT equation.get_part_by_tex("E", index=0)
"""

# Fallback system prompt for non-voiceover version
SYSTEM_PROMPT_NO_VOICEOVER = """
You are an expert at creating SIMPLE, CLEAR educational Manim animations for STEM subjects WITHOUT voiceover.

CRITICAL: The class MUST be named exactly 'CourseScene' - do not use any other name!

Generate a regular Manim Scene (NOT VoiceoverScene) that uses visual animations with appropriate timing.

IMPORTANT: 
- Inherit from Scene, NOT VoiceoverScene
- Do NOT use self.voiceover() context managers
- Use self.play() with explicit run_time parameters
- Use self.wait() for pauses between animations
- Keep each concept on screen for 3-5 seconds
- THE CLASS MUST be named exactly 'CourseScene' - do not use any other name!

Example structure:
```python
class CourseScene(Scene):
    def construct(self):
        # Title slide
        title = Text("Your Topic", font_size=48)
        self.play(FadeIn(title), run_time=2)
        self.wait(2)
        self.play(FadeOut(title), run_time=1)
        
        # Concept slide
        concept = Text("Key Concept", font_size=36)
        visual = Circle(radius=1, color=BLUE)
        group = VGroup(concept, visual).arrange(DOWN)
        
        self.play(FadeIn(group), run_time=2)
        self.wait(3)
        self.play(FadeOut(group), run_time=1)
```

Use the same visual guidelines and constraints as the voiceover version, but with explicit timing.
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
    from manim import config, Scene
    from manim_voiceover import VoiceoverScene
    from manim_voiceover.services.elevenlabs import ElevenLabsService
    
    # Set up API keys
    elevenlabs_available = False
    if "ELEVENLABS_API_KEY" in os.environ:
        os.environ["ELEVEN_API_KEY"] = os.environ["ELEVENLABS_API_KEY"]
        elevenlabs_available = True
    
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
    
    # Try with voiceover first if ElevenLabs is available
    use_voiceover = elevenlabs_available
    attempt = 0
    max_attempts = 2
    scene = None
    warnings = []
    
    while attempt < max_attempts and scene is None:
        attempt += 1
        
        # Choose prompt based on voiceover availability
        prompt_to_use = SYSTEM_PROMPT if use_voiceover else SYSTEM_PROMPT_NO_VOICEOVER
        
        print(f"Attempt {attempt}: Generating {'with' if use_voiceover else 'without'} voiceover...")
        
        # Generate Manim code using Gemini
        model = genai.GenerativeModel('gemini-2.5-pro')
        prompt = f"{prompt_to_use}\n\nCourse Content:\n{course_content}\n\nGenerate the CourseScene class code:"
        
        response = model.generate_content(prompt, generation_config=genai.types.GenerationConfig(
            temperature=0.1,
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
        with open(f"/tmp/generated_code_attempt_{attempt}.py", "w") as f:
            f.write(manim_code)
        
        # Execute the generated code to create the scene class
        exec_globals = {
            'Scene': Scene,
            'VoiceoverScene': VoiceoverScene,
            'ElevenLabsService': ElevenLabsService,
        }
        
        # Import all Manim components
        exec("from manim import *", exec_globals)
        
        try:
            exec(manim_code, exec_globals)
            
            # Find the scene class
            scene_class = exec_globals.get('CourseScene')
            if not scene_class:
                raise Exception("Generated code must define a class named 'CourseScene'")
            
            # Try to render the scene
            print("Rendering Manim scene...")
            config.media_dir = "/tmp/manim"
            config.output_file = "output"
            
            scene = scene_class()
            scene.render()
            
            print(f"✓ Successfully rendered {'with' if use_voiceover else 'without'} voiceover")
            if not use_voiceover:
                warnings.append("Video generated without voiceover due to ElevenLabs unavailability")
            
        except Exception as e:
            error_msg = str(e).lower()
            print(f"Error during attempt {attempt}: {e}")
            
            # Check if it's an ElevenLabs-related error
            if use_voiceover and ("elevenlabs" in error_msg or "voiceover" in error_msg or "api" in error_msg):
                print("⚠ ElevenLabs error detected, switching to non-voiceover mode...")
                use_voiceover = False
                warnings.append("Switched to non-voiceover mode due to ElevenLabs error")
                scene = None  # Reset to retry
            else:
                # Other error, don't retry
                print(f"Generated code:\n{manim_code}")
                raise Exception(f"Failed to execute/render Manim code: {e}")
    
    if scene is None:
        raise Exception("Failed to generate video after all attempts")
    
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
    
    result = {
        "r2_url": r2_url,
        "r2_filename": r2_filename,
        "status": "success",
        "message": "Video generated and uploaded successfully!",
        "has_voiceover": use_voiceover,
    }
    
    if warnings:
        result["warnings"] = warnings
    
    return result


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
    print(f"✓ R2 URL: {result['r2_url']}")
    if 'warnings' in result:
        print(f"⚠ Warnings: {', '.join(result['warnings'])}")