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
You are an expert at creating SIMPLE, CLEAR educational Manim animations with voiceovers for STEM subjects.

CORE PHILOSOPHY: Think of the video as a SLIDESHOW with VISUAL ILLUSTRATIONS. Each "slide" should:
- Display ONE clear concept WITH a visual illustration
- Combine text/equations WITH shapes, diagrams, or visual representations
- Stay on screen for 5-10 seconds
- Transition cleanly to the next slide
- ALWAYS include visual elements, not just text

SLIDE-BASED STRUCTURE (60 seconds total):
1. Title Slide (5-8 sec): Show topic name with a relevant icon/visual
2. Concept Slides (8-10 sec each): 4-6 slides, EACH with text + illustration
3. Conclusion Slide (5-8 sec): Brief summary with visual recap

MANDATORY SLIDE PATTERN - ALWAYS COMBINE TEXT + VISUALS:
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
        
        # SLIDE 1: Title with Icon
        title = Text("Your Topic Title", font_size=48)
        icon = Circle(radius=0.5, color=BLUE).next_to(title, LEFT)  # Add visual element
        title_group = VGroup(icon, title)
        with self.voiceover(text="Welcome! Today we'll learn about [topic].") as tracker:
            self.play(FadeIn(title_group), run_time=tracker.duration)
        self.wait(1)
        self.play(FadeOut(title_group))
        
        # SLIDE 2: Concept with Illustration
        # LEFT SIDE: Visual illustration
        visual = Circle(radius=1, color=BLUE).shift(LEFT * 3)
        arrow = Arrow(start=ORIGIN, end=RIGHT, color=YELLOW).next_to(visual, RIGHT)
        
        # RIGHT SIDE: Text explanation
        concept = Text("Key Concept", font_size=32).shift(RIGHT * 2.5).shift(UP)
        detail = Text("Explanation here", font_size=24).next_to(concept, DOWN)
        
        with self.voiceover(text="Here's the first concept.") as tracker:
            self.play(FadeIn(visual), FadeIn(arrow), run_time=tracker.duration)
        with self.voiceover(text="This is what it means.") as tracker:
            self.play(FadeIn(concept), FadeIn(detail), run_time=tracker.duration)
        self.wait(0.5)
        self.play(FadeOut(visual), FadeOut(arrow), FadeOut(concept), FadeOut(detail))
        
        # SLIDE 3: Another concept with different visual
        # For equations: Show equation + visual representation
        equation = MathTex("E = mc^2", font_size=48).shift(UP * 2)
        
        # Visual representation below
        energy_box = Rectangle(width=1.5, height=1, color=YELLOW).shift(DOWN + LEFT * 2)
        energy_label = Text("Energy", font_size=20).next_to(energy_box, DOWN, buff=0.2)
        equals_sign = Text("=", font_size=36).shift(DOWN)
        mass_circle = Circle(radius=0.4, color=RED).shift(DOWN + RIGHT)
        speed_text = MathTex("c^2", font_size=30).next_to(mass_circle, RIGHT)
        
        visual_group = VGroup(energy_box, energy_label, equals_sign, mass_circle, speed_text)
        
        with self.voiceover(text="Einstein's famous equation.") as tracker:
            self.play(Write(equation), run_time=tracker.duration)
        with self.voiceover(text="Energy equals mass times speed of light squared.") as tracker:
            self.play(FadeIn(visual_group), run_time=tracker.duration)
        self.wait(0.5)
        self.play(FadeOut(equation), FadeOut(visual_group))
        
        # Continue with more illustrated slides...
        
        # FINAL SLIDE: Conclusion with visual summary
        conclusion = Text("Summary", font_size=36).shift(UP)
        summary_icons = VGroup(
            Circle(radius=0.3, color=BLUE).shift(LEFT),
            Circle(radius=0.3, color=RED),
            Circle(radius=0.3, color=GREEN).shift(RIGHT)
        ).shift(DOWN)
        with self.voiceover(text="To recap, we covered these key points.") as tracker:
            self.play(FadeIn(conclusion), FadeIn(summary_icons), run_time=tracker.duration)
        self.wait(1)
        self.play(FadeOut(conclusion), FadeOut(summary_icons))
```

CRITICAL RULES TO AVOID ERRORS:
1. **ALWAYS INCLUDE VISUALS**: Every slide must have illustrations, not just text
2. **KEEP IT SIMPLE**: Use only Text, MathTex, Circle, Rectangle, Arrow, Line, Dot
3. **NO COMPLEX FEATURES**: Avoid SVGMobject, complex graphs, 3D objects, advanced features
4. **TEXT + VISUAL COMBO**: Each slide = explanation text + visual representation
5. **ALWAYS CLEAR THE SCREEN**: Use FadeOut to remove ALL objects before next slide
6. **SAFE ANIMATIONS ONLY**: Use FadeIn, FadeOut, Write, Create, GrowFromCenter
7. **SIMPLE POSITIONING**: Use .next_to(), .to_edge(), .shift() - keep it basic
8. **SHORT VOICEOVERS**: 1-2 sentences max per voiceover block

VISUAL ILLUSTRATION IDEAS BY SUBJECT:
**Mathematics:**
- Equations: Show equation + geometric representation (circles for variables, rectangles for operations)
- Geometry: Draw the actual shapes being discussed
- Algebra: Use number lines with dots, arrows showing relationships
- Example: For "x + 2 = 5", show equation AND three boxes with visual addition

**Physics:**
- Forces: Arrows of different sizes/colors
- Motion: Dots moving along paths with arrows
- Energy: Boxes/circles of different sizes to show amounts
- Example: For gravity, show Earth (circle) with arrows pointing down

**Chemistry:**
- Molecules: Circles (atoms) connected by lines (bonds)
- Reactions: Show before/after with arrow between
- States: Use different colored circles for different states
- Example: H2O as 2 small circles (H) connected to 1 larger circle (O)

**Biology:**
- Cells: Circles with smaller circles inside (organelles)
- DNA: Two parallel wavy lines
- Processes: Flowchart with arrows
- Example: Photosynthesis as sun → plant → oxygen (icons)

**Computer Science:**
- Arrays: Rectangles in a row with numbers inside
- Trees: Circles connected by lines in tree structure
- Algorithms: Step-by-step boxes with arrows
- Example: Binary search as boxes with arrows showing elimination

**Engineering:**
- Systems: Boxes connected by lines/arrows
- Circuits: Rectangles (components) with lines (wires)
- Processes: Flowcharts with labeled boxes
- Example: Bridge as triangles showing force distribution

ALLOWED VISUAL ELEMENTS (SIMPLE ONLY):
- Text("Your text", font_size=36)
- MathTex("x^2 + y^2 = r^2") for equations
- Circle(radius=1, color=BLUE)
- Rectangle(width=2, height=1, color=RED)
- Arrow(start=LEFT, end=RIGHT)
- Line(start=UP, end=DOWN)
- Dot(point=ORIGIN, color=YELLOW)
- VGroup(object1, object2) to group objects

SAFE COLORS:
RED, BLUE, GREEN, YELLOW, PINK, PURPLE, ORANGE, WHITE, BLACK, GRAY

SAFE ANIMATIONS:
- FadeIn(obj)
- FadeOut(obj)
- Write(obj)
- Create(obj)
- GrowFromCenter(obj)

API SAFETY RULES (CRITICAL):
- NEVER use get_part_by_tex() with 'index' parameter
- To select parts: use equation[0], equation[1], NOT get_part_by_tex with index
- SurroundingRectangle MUST receive a Mobject (like Text or MathTex object), NOT a string
- Example: rect = SurroundingRectangle(my_text) where my_text = Text("hello")
- NEVER pass strings or numbers to SurroundingRectangle

STRUCTURE YOUR VIDEO AS SLIDES:
1. Count your content blocks
2. Allocate ~10 seconds per key concept
3. Create ONE slide per concept
4. Each slide: FadeIn content → Voiceover → Wait → FadeOut
5. Keep transitions smooth but SIMPLE

EXAMPLE FOR MATH TOPIC:
Slide 1: Title "Pythagorean Theorem"
Slide 2: Show equation a² + b² = c²
Slide 3: Draw simple right triangle
Slide 4: Label sides a, b, c
Slide 5: Conclusion "Used to find triangle sides"

REMEMBER: Simplicity is key. If in doubt, make it simpler. A clear, simple video is better than a complex one that errors.

ONLY return the Python code for the CourseScene class. No explanations, no markdown fences.
"""


# Fallback system prompt for non-voiceover version
SYSTEM_PROMPT_NO_VOICEOVER = """
You are an expert at creating SIMPLE, CLEAR educational Manim animations for STEM subjects WITHOUT voiceover.

Generate a regular Manim Scene (NOT VoiceoverScene) that uses visual animations with appropriate timing.

IMPORTANT: 
- Inherit from Scene, NOT VoiceoverScene
- Do NOT use self.voiceover() context managers
- Use self.play() with explicit run_time parameters
- Use self.wait() for pauses between animations
- Keep each concept on screen for 3-5 seconds

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
            temperature=0.3,
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